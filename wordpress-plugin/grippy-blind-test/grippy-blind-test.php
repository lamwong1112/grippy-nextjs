<?php
/**
 * Plugin Name: Grippy Blind Test
 * Description: Stores gym blind-test scores and lab measurements. Exposes /wp-json/grippy/v1/blind-test/* for the Next.js app.
 * Version: 1.0.0
 * Author: Grippy
 * Text Domain: grippy-blind-test
 */

if (!defined('ABSPATH')) {
    exit;
}

define('GRIPPY_BLIND_SCORE_CPT', 'blind_score');
define('GRIPPY_LAB_MEASUREMENT_CPT', 'lab_measurement');
define('GRIPPY_BLIND_TEST_OPTION', 'grippy_blind_test_settings');

/**
 * Default seawater:mineral ratios used in the scorecard.
 */
function grippy_blind_test_default_ratios()
{
    return [
        '0:100',
        '10:90',
        '20:80',
        '30:70',
        '40:60',
        '50:50',
        '60:40',
        '70:30',
        '80:20',
        '90:10',
        '100:0',
    ];
}

function grippy_blind_test_default_sample_codes()
{
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
}

function grippy_blind_test_default_settings()
{
    $codes = grippy_blind_test_default_sample_codes();
    $ratios = grippy_blind_test_default_ratios();
    $mapping = [];
    $enabled = [];

    foreach ($codes as $i => $code) {
        $mapping[$code] = $ratios[$i] ?? '';
        // Enable first 3 by default for a typical gym session.
        $enabled[$code] = $i < 3;
    }

    return [
        'pin' => '1234',
        'default_round' => 'R1',
        'mapping' => $mapping,
        'enabled' => $enabled,
        'gyms' => ['Campus Climbing', 'Other'],
    ];
}

function grippy_blind_test_get_settings()
{
    $defaults = grippy_blind_test_default_settings();
    $stored = get_option(GRIPPY_BLIND_TEST_OPTION, []);
    if (!is_array($stored)) {
        $stored = [];
    }

    $settings = array_merge($defaults, $stored);
    $settings['mapping'] = array_merge(
        $defaults['mapping'],
        is_array($stored['mapping'] ?? null) ? $stored['mapping'] : []
    );
    $settings['enabled'] = array_merge(
        $defaults['enabled'],
        is_array($stored['enabled'] ?? null) ? $stored['enabled'] : []
    );
    if (!is_array($settings['gyms']) || empty($settings['gyms'])) {
        $settings['gyms'] = $defaults['gyms'];
    }

    return $settings;
}

function grippy_blind_test_register_cpts()
{
    register_post_type(GRIPPY_BLIND_SCORE_CPT, [
        'labels' => [
            'name' => 'Blind Scores',
            'singular_name' => 'Blind score',
            'menu_name' => 'Blind Scores',
            'add_new_item' => 'Add score',
            'edit_item' => 'View score',
            'search_items' => 'Search scores',
            'not_found' => 'No scores yet',
            'all_items' => 'All scores',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_position' => 27,
        'menu_icon' => 'dashicons-clipboard',
        'supports' => ['title'],
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'show_in_rest' => false,
    ]);

    register_post_type(GRIPPY_LAB_MEASUREMENT_CPT, [
        'labels' => [
            'name' => 'Lab Measurements',
            'singular_name' => 'Lab measurement',
            'menu_name' => 'Lab Data',
            'add_new_item' => 'Add measurement',
            'edit_item' => 'View measurement',
            'search_items' => 'Search lab data',
            'not_found' => 'No lab data yet',
            'all_items' => 'All measurements',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_position' => 28,
        'menu_icon' => 'dashicons-chart-area',
        'supports' => ['title'],
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'show_in_rest' => false,
    ]);
}
add_action('init', 'grippy_blind_test_register_cpts');

/**
 * Settings page under Settings → Blind Test.
 */
function grippy_blind_test_register_settings_page()
{
    add_options_page(
        'Blind Test',
        'Blind Test',
        'manage_options',
        'grippy-blind-test',
        'grippy_blind_test_render_settings_page'
    );
}
add_action('admin_menu', 'grippy_blind_test_register_settings_page');

function grippy_blind_test_render_settings_page()
{
    if (!current_user_can('manage_options')) {
        return;
    }

    if (
        isset($_POST['grippy_blind_test_nonce']) &&
        wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['grippy_blind_test_nonce'])), 'grippy_blind_test_save')
    ) {
        $codes = grippy_blind_test_default_sample_codes();
        $mapping = [];
        $enabled = [];

        foreach ($codes as $code) {
            $map_key = 'mapping_' . $code;
            $en_key = 'enabled_' . $code;
            $mapping[$code] = isset($_POST[$map_key])
                ? sanitize_text_field(wp_unslash($_POST[$map_key]))
                : '';
            $enabled[$code] = !empty($_POST[$en_key]);
        }

        $gyms_raw = isset($_POST['gyms']) ? sanitize_textarea_field(wp_unslash($_POST['gyms'])) : '';
        $gyms = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $gyms_raw))));

        $settings = [
            'pin' => isset($_POST['pin'])
                ? preg_replace('/\D/', '', sanitize_text_field(wp_unslash($_POST['pin'])))
                : '1234',
            'default_round' => isset($_POST['default_round'])
                ? sanitize_text_field(wp_unslash($_POST['default_round']))
                : 'R1',
            'mapping' => $mapping,
            'enabled' => $enabled,
            'gyms' => $gyms ?: ['Campus Climbing', 'Other'],
        ];

        if (strlen($settings['pin']) !== 4) {
            $settings['pin'] = '1234';
        }

        update_option(GRIPPY_BLIND_TEST_OPTION, $settings);
        echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
    }

    $settings = grippy_blind_test_get_settings();
    $codes = grippy_blind_test_default_sample_codes();
    $ratios = grippy_blind_test_default_ratios();
    ?>
    <div class="wrap">
        <h1>Blind Test Settings</h1>
        <p>Map blind sample codes to seawater:mineral ratios. Only enabled codes appear on the gym form. The PIN unlocks the public gym form (not shown to climbers as a ratio).</p>
        <form method="post">
            <?php wp_nonce_field('grippy_blind_test_save', 'grippy_blind_test_nonce'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="pin">Gym session PIN (4 digits)</label></th>
                    <td><input name="pin" id="pin" type="text" inputmode="numeric" maxlength="4" value="<?php echo esc_attr($settings['pin']); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="default_round">Default round</label></th>
                    <td>
                        <select name="default_round" id="default_round">
                            <?php foreach (['R1', 'R2', 'R3'] as $round) : ?>
                                <option value="<?php echo esc_attr($round); ?>" <?php selected($settings['default_round'], $round); ?>><?php echo esc_html($round); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="gyms">Gyms (one per line)</label></th>
                    <td><textarea name="gyms" id="gyms" rows="4" class="large-text"><?php echo esc_textarea(implode("\n", $settings['gyms'])); ?></textarea></td>
                </tr>
            </table>

            <h2>Sample code mapping</h2>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Enabled</th>
                        <th>Code</th>
                        <th>Ratio (sea:mineral)</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($codes as $code) : ?>
                        <tr>
                            <td><input type="checkbox" name="enabled_<?php echo esc_attr($code); ?>" value="1" <?php checked(!empty($settings['enabled'][$code])); ?> /></td>
                            <td><strong>Sample <?php echo esc_html($code); ?></strong></td>
                            <td>
                                <select name="mapping_<?php echo esc_attr($code); ?>">
                                    <option value="">—</option>
                                    <?php foreach ($ratios as $ratio) : ?>
                                        <option value="<?php echo esc_attr($ratio); ?>" <?php selected($settings['mapping'][$code] ?? '', $ratio); ?>><?php echo esc_html($ratio); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php submit_button('Save settings'); ?>
        </form>
    </div>
    <?php
}

/**
 * REST routes.
 */
function grippy_blind_test_register_rest()
{
    register_rest_route('grippy/v1', '/blind-test/public-config', [
        'methods' => 'GET',
        'callback' => 'grippy_blind_test_public_config',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('grippy/v1', '/blind-test/verify-pin', [
        'methods' => 'POST',
        'callback' => 'grippy_blind_test_verify_pin',
        'permission_callback' => '__return_true',
        'args' => [
            'pin' => [
                'required' => true,
                'type' => 'string',
            ],
        ],
    ]);

    register_rest_route('grippy/v1', '/blind-test/score', [
        'methods' => 'POST',
        'callback' => 'grippy_blind_test_create_score',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('grippy/v1', '/blind-test/lab', [
        'methods' => 'POST',
        'callback' => 'grippy_blind_test_create_lab',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('grippy/v1', '/blind-test/entries', [
        'methods' => 'GET',
        'callback' => 'grippy_blind_test_list_entries',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);
}
add_action('rest_api_init', 'grippy_blind_test_register_rest');

function grippy_blind_test_public_config()
{
    $settings = grippy_blind_test_get_settings();
    $samples = [];

    foreach (grippy_blind_test_default_sample_codes() as $code) {
        if (!empty($settings['enabled'][$code])) {
            $samples[] = $code;
        }
    }

    return rest_ensure_response([
        'ok' => true,
        'samples' => $samples,
        'requiresPin' => true,
        'defaultRound' => $settings['default_round'],
        'gyms' => array_values($settings['gyms']),
        'rounds' => ['R1', 'R2', 'R3'],
        'scoreFields' => [
            ['key' => 'friction', 'label' => 'Friction / Grip', 'weight' => 25],
            ['key' => 'moisture', 'label' => 'Moisture / Dryness', 'weight' => 20],
            ['key' => 'particle_feel', 'label' => 'Particle / Feel', 'weight' => 15],
            ['key' => 'dust', 'label' => 'Dust / Residue', 'weight' => 10],
            ['key' => 'longevity', 'label' => 'Longevity / Re-chalk', 'weight' => 10],
        ],
    ]);
}

function grippy_blind_test_verify_pin(WP_REST_Request $request)
{
    $settings = grippy_blind_test_get_settings();
    $pin = preg_replace('/\D/', '', (string) $request->get_param('pin'));

    if ($pin === '' || !hash_equals((string) $settings['pin'], $pin)) {
        return new WP_Error('invalid_pin', 'Incorrect session PIN.', ['status' => 403]);
    }

    return rest_ensure_response(['ok' => true]);
}

function grippy_blind_test_clamp_score($value)
{
    if ($value === null || $value === '' || $value === 'n/a' || $value === 'N/A') {
        return null;
    }
    $n = (int) $value;
    if ($n < 1 || $n > 5) {
        return null;
    }
    return $n;
}

function grippy_blind_test_create_score(WP_REST_Request $request)
{
    $settings = grippy_blind_test_get_settings();
    $pin = preg_replace('/\D/', '', (string) $request->get_param('pin'));

    if ($pin === '' || !hash_equals((string) $settings['pin'], $pin)) {
        return new WP_Error('invalid_pin', 'Incorrect session PIN.', ['status' => 403]);
    }

    $sample_code = strtoupper(sanitize_text_field((string) $request->get_param('sample_code')));
    if ($sample_code === '' || empty($settings['enabled'][$sample_code])) {
        return new WP_Error('invalid_sample', 'Sample code is not enabled for this session.', ['status' => 400]);
    }

    $round = sanitize_text_field((string) $request->get_param('round'));
    if (!in_array($round, ['R1', 'R2', 'R3'], true)) {
        $round = $settings['default_round'];
    }

    $gym = sanitize_text_field((string) $request->get_param('gym'));
    $tester_code = sanitize_text_field((string) $request->get_param('tester_code'));
    $session_id = sanitize_text_field((string) $request->get_param('session_id'));
    $notes = sanitize_textarea_field((string) $request->get_param('notes'));
    $preference_rank = $request->get_param('preference_rank');
    $preference_rank = $preference_rank === null || $preference_rank === ''
        ? null
        : max(1, min(99, (int) $preference_rank));

    $scores = [
        'friction' => grippy_blind_test_clamp_score($request->get_param('friction')),
        'moisture' => grippy_blind_test_clamp_score($request->get_param('moisture')),
        'particle_feel' => grippy_blind_test_clamp_score($request->get_param('particle_feel')),
        'dust' => grippy_blind_test_clamp_score($request->get_param('dust')),
        'longevity' => grippy_blind_test_clamp_score($request->get_param('longevity')),
    ];

    $has_any = false;
    foreach ($scores as $s) {
        if ($s !== null) {
            $has_any = true;
            break;
        }
    }
    if (!$has_any) {
        return new WP_Error('empty_scores', 'Please rate at least one criterion.', ['status' => 400]);
    }

    $title = sprintf(
        'Sample %s · %s · %s',
        $sample_code,
        $round,
        gmdate('Y-m-d H:i')
    );

    $post_id = wp_insert_post(
        [
            'post_type' => GRIPPY_BLIND_SCORE_CPT,
            'post_title' => $title,
            'post_status' => 'private',
        ],
        true
    );

    if (is_wp_error($post_id)) {
        return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
    }

    $created_at = gmdate('c');
    update_post_meta($post_id, '_grippy_sample_code', $sample_code);
    update_post_meta($post_id, '_grippy_round', $round);
    update_post_meta($post_id, '_grippy_gym', $gym);
    update_post_meta($post_id, '_grippy_tester_code', $tester_code);
    update_post_meta($post_id, '_grippy_session_id', $session_id);
    update_post_meta($post_id, '_grippy_notes', $notes);
    update_post_meta($post_id, '_grippy_preference_rank', $preference_rank);
    update_post_meta($post_id, '_grippy_created_at', $created_at);

    foreach ($scores as $key => $value) {
        update_post_meta($post_id, '_grippy_' . $key, $value);
    }

    $weighted = grippy_blind_test_gym_weighted($scores);
    update_post_meta($post_id, '_grippy_weighted', $weighted);

    return rest_ensure_response([
        'ok' => true,
        'id' => $post_id,
        'weighted' => $weighted,
    ]);
}

function grippy_blind_test_gym_weighted(array $scores)
{
    $weights = [
        'friction' => 25,
        'moisture' => 20,
        'particle_feel' => 15,
        'dust' => 10,
        'longevity' => 10,
    ];
    $sum_w = 0;
    $sum = 0.0;

    foreach ($weights as $key => $w) {
        if ($scores[$key] === null) {
            continue;
        }
        $sum += $scores[$key] * $w;
        $sum_w += $w;
    }

    if ($sum_w === 0) {
        return null;
    }

    return round($sum / $sum_w, 3);
}

function grippy_blind_test_nullable_float($value)
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_numeric($value)) {
        return null;
    }
    return (float) $value;
}

function grippy_blind_test_gate($value)
{
    $v = strtolower(trim((string) $value));
    if ($v === 'pass' || $v === 'fail') {
        return $v;
    }
    return null;
}

function grippy_blind_test_create_lab(WP_REST_Request $request)
{
    $ratio = sanitize_text_field((string) $request->get_param('ratio'));
    $allowed = grippy_blind_test_default_ratios();
    if (!in_array($ratio, $allowed, true)) {
        return new WP_Error('invalid_ratio', 'Invalid blend ratio.', ['status' => 400]);
    }

    $round = sanitize_text_field((string) $request->get_param('round'));
    if (!in_array($round, ['R1', 'R2', 'R3'], true)) {
        $round = 'R1';
    }

    $fields = [
        'friction_coef' => grippy_blind_test_nullable_float($request->get_param('friction_coef')),
        'd50' => grippy_blind_test_nullable_float($request->get_param('d50')),
        'particle_sd' => grippy_blind_test_nullable_float($request->get_param('particle_sd')),
        'moist_pct' => grippy_blind_test_nullable_float($request->get_param('moist_pct')),
        'abs_s' => grippy_blind_test_nullable_float($request->get_param('abs_s')),
        'pm25' => grippy_blind_test_nullable_float($request->get_param('pm25')),
        'caking_30d' => grippy_blind_test_nullable_float($request->get_param('caking_30d')),
        're_chalk' => grippy_blind_test_nullable_float($request->get_param('re_chalk')),
        'cost_per_g' => grippy_blind_test_nullable_float($request->get_param('cost_per_g')),
        'feel' => grippy_blind_test_clamp_score($request->get_param('feel')),
        'gate_impurities' => grippy_blind_test_gate($request->get_param('gate_impurities')),
        'gate_heavy_metals' => grippy_blind_test_gate($request->get_param('gate_heavy_metals')),
        'gate_caking' => grippy_blind_test_gate($request->get_param('gate_caking')),
        'gate_skin_safety' => grippy_blind_test_gate($request->get_param('gate_skin_safety')),
    ];

    $replace_id = (int) $request->get_param('id');
    $existing = null;

    if ($replace_id > 0) {
        $post = get_post($replace_id);
        if ($post && $post->post_type === GRIPPY_LAB_MEASUREMENT_CPT) {
            $existing = $replace_id;
        }
    } else {
        $found = get_posts([
            'post_type' => GRIPPY_LAB_MEASUREMENT_CPT,
            'post_status' => 'private',
            'posts_per_page' => 1,
            'meta_query' => [
                'relation' => 'AND',
                [
                    'key' => '_grippy_ratio',
                    'value' => $ratio,
                ],
                [
                    'key' => '_grippy_round',
                    'value' => $round,
                ],
            ],
            'fields' => 'ids',
        ]);
        if (!empty($found)) {
            $existing = (int) $found[0];
        }
    }

    $title = sprintf('%s · %s', $ratio, $round);
    $created_at = gmdate('c');

    if ($existing) {
        $post_id = $existing;
        wp_update_post([
            'ID' => $post_id,
            'post_title' => $title,
        ]);
    } else {
        $post_id = wp_insert_post(
            [
                'post_type' => GRIPPY_LAB_MEASUREMENT_CPT,
                'post_title' => $title,
                'post_status' => 'private',
            ],
            true
        );
        if (is_wp_error($post_id)) {
            return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
        }
        update_post_meta($post_id, '_grippy_created_at', $created_at);
    }

    update_post_meta($post_id, '_grippy_ratio', $ratio);
    update_post_meta($post_id, '_grippy_round', $round);
    update_post_meta($post_id, '_grippy_updated_at', $created_at);

    foreach ($fields as $key => $value) {
        update_post_meta($post_id, '_grippy_' . $key, $value);
    }

    $gates = [
        $fields['gate_impurities'],
        $fields['gate_heavy_metals'],
        $fields['gate_caking'],
        $fields['gate_skin_safety'],
    ];
    $overall = 'pass';
    foreach ($gates as $g) {
        if ($g === 'fail') {
            $overall = 'fail';
            break;
        }
        if ($g === null) {
            $overall = 'pending';
        }
    }
    if ($overall !== 'fail') {
        $all_pass = true;
        foreach ($gates as $g) {
            if ($g !== 'pass') {
                $all_pass = false;
                break;
            }
        }
        $overall = $all_pass ? 'pass' : 'pending';
    }
    update_post_meta($post_id, '_grippy_gate_overall', $overall);

    return rest_ensure_response([
        'ok' => true,
        'id' => $post_id,
        'gate_overall' => $overall,
    ]);
}

function grippy_blind_test_score_payload($post_id)
{
    return [
        'id' => $post_id,
        'sample_code' => get_post_meta($post_id, '_grippy_sample_code', true),
        'round' => get_post_meta($post_id, '_grippy_round', true),
        'gym' => get_post_meta($post_id, '_grippy_gym', true),
        'tester_code' => get_post_meta($post_id, '_grippy_tester_code', true),
        'session_id' => get_post_meta($post_id, '_grippy_session_id', true),
        'friction' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_friction'),
        'moisture' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_moisture'),
        'particle_feel' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_particle_feel'),
        'dust' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_dust'),
        'longevity' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_longevity'),
        'preference_rank' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_preference_rank'),
        'notes' => get_post_meta($post_id, '_grippy_notes', true),
        'weighted' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_weighted'),
        'created_at' => get_post_meta($post_id, '_grippy_created_at', true) ?: get_the_date('c', $post_id),
    ];
}

function grippy_blind_test_lab_payload($post_id)
{
    return [
        'id' => $post_id,
        'ratio' => get_post_meta($post_id, '_grippy_ratio', true),
        'round' => get_post_meta($post_id, '_grippy_round', true),
        'friction_coef' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_friction_coef'),
        'd50' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_d50'),
        'particle_sd' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_particle_sd'),
        'moist_pct' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_moist_pct'),
        'abs_s' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_abs_s'),
        'pm25' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_pm25'),
        'caking_30d' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_caking_30d'),
        're_chalk' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_re_chalk'),
        'cost_per_g' => grippy_blind_test_meta_float_or_null($post_id, '_grippy_cost_per_g'),
        'feel' => grippy_blind_test_meta_int_or_null($post_id, '_grippy_feel'),
        'gate_impurities' => get_post_meta($post_id, '_grippy_gate_impurities', true) ?: null,
        'gate_heavy_metals' => get_post_meta($post_id, '_grippy_gate_heavy_metals', true) ?: null,
        'gate_caking' => get_post_meta($post_id, '_grippy_gate_caking', true) ?: null,
        'gate_skin_safety' => get_post_meta($post_id, '_grippy_gate_skin_safety', true) ?: null,
        'gate_overall' => get_post_meta($post_id, '_grippy_gate_overall', true) ?: null,
        'created_at' => get_post_meta($post_id, '_grippy_created_at', true) ?: get_the_date('c', $post_id),
        'updated_at' => get_post_meta($post_id, '_grippy_updated_at', true) ?: null,
    ];
}

function grippy_blind_test_meta_int_or_null($post_id, $key)
{
    $v = get_post_meta($post_id, $key, true);
    if ($v === '' || $v === null || $v === false) {
        return null;
    }
    return (int) $v;
}

function grippy_blind_test_meta_float_or_null($post_id, $key)
{
    $v = get_post_meta($post_id, $key, true);
    if ($v === '' || $v === null || $v === false) {
        return null;
    }
    return (float) $v;
}

function grippy_blind_test_list_entries()
{
    $settings = grippy_blind_test_get_settings();

    $score_ids = get_posts([
        'post_type' => GRIPPY_BLIND_SCORE_CPT,
        'post_status' => 'private',
        'posts_per_page' => 2000,
        'orderby' => 'date',
        'order' => 'DESC',
        'fields' => 'ids',
    ]);

    $lab_ids = get_posts([
        'post_type' => GRIPPY_LAB_MEASUREMENT_CPT,
        'post_status' => 'private',
        'posts_per_page' => 500,
        'orderby' => 'date',
        'order' => 'DESC',
        'fields' => 'ids',
    ]);

    $scores = array_map('grippy_blind_test_score_payload', $score_ids);
    $lab = array_map('grippy_blind_test_lab_payload', $lab_ids);

    $enabled = [];
    foreach (grippy_blind_test_default_sample_codes() as $code) {
        if (!empty($settings['enabled'][$code])) {
            $enabled[] = $code;
        }
    }

    return rest_ensure_response([
        'ok' => true,
        'mapping' => $settings['mapping'],
        'enabledSamples' => $enabled,
        'scores' => $scores,
        'lab' => $lab,
        'ratios' => grippy_blind_test_default_ratios(),
    ]);
}

/**
 * Admin columns for blind scores.
 */
function grippy_blind_score_columns($columns)
{
    return [
        'cb' => $columns['cb'] ?? '',
        'title' => 'Entry',
        'sample' => 'Sample',
        'round' => 'Round',
        'weighted' => 'Weighted',
        'created' => 'Created',
    ];
}
add_filter('manage_' . GRIPPY_BLIND_SCORE_CPT . '_posts_columns', 'grippy_blind_score_columns');

function grippy_blind_score_column_content($column, $post_id)
{
    if ($column === 'sample') {
        echo esc_html((string) get_post_meta($post_id, '_grippy_sample_code', true));
    } elseif ($column === 'round') {
        echo esc_html((string) get_post_meta($post_id, '_grippy_round', true));
    } elseif ($column === 'weighted') {
        $w = get_post_meta($post_id, '_grippy_weighted', true);
        echo esc_html($w === '' || $w === false ? '—' : (string) $w);
    } elseif ($column === 'created') {
        $meta = get_post_meta($post_id, '_grippy_created_at', true);
        echo esc_html($meta ? $meta : get_the_date('c', $post_id));
    }
}
add_action('manage_' . GRIPPY_BLIND_SCORE_CPT . '_posts_custom_column', 'grippy_blind_score_column_content', 10, 2);

function grippy_lab_columns($columns)
{
    return [
        'cb' => $columns['cb'] ?? '',
        'title' => 'Entry',
        'ratio' => 'Ratio',
        'round' => 'Round',
        'gate' => 'Gate',
        'updated' => 'Updated',
    ];
}
add_filter('manage_' . GRIPPY_LAB_MEASUREMENT_CPT . '_posts_columns', 'grippy_lab_columns');

function grippy_lab_column_content($column, $post_id)
{
    if ($column === 'ratio') {
        echo esc_html((string) get_post_meta($post_id, '_grippy_ratio', true));
    } elseif ($column === 'round') {
        echo esc_html((string) get_post_meta($post_id, '_grippy_round', true));
    } elseif ($column === 'gate') {
        echo esc_html((string) (get_post_meta($post_id, '_grippy_gate_overall', true) ?: '—'));
    } elseif ($column === 'updated') {
        $meta = get_post_meta($post_id, '_grippy_updated_at', true);
        echo esc_html($meta ? $meta : get_the_date('c', $post_id));
    }
}
add_action('manage_' . GRIPPY_LAB_MEASUREMENT_CPT . '_posts_custom_column', 'grippy_lab_column_content', 10, 2);
