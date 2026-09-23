<?php
/**
 * Plugin Name: Grippy Waitlist
 * Description: Stores D2C waitlist emails as a private custom post type. Exposes POST /wp-json/grippy/v1/waitlist for the Next.js storefront.
 * Version: 1.0.0
 * Author: Grippy
 * Text Domain: grippy-waitlist
 */

if (!defined('ABSPATH')) {
    exit;
}

define('GRIPPY_WAITLIST_CPT', 'waitlist_signup');

/**
 * Register Waitlist Signups CPT — visible in WP Admin under "Waitlist".
 */
function grippy_waitlist_register_cpt()
{
    register_post_type(GRIPPY_WAITLIST_CPT, [
        'labels' => [
            'name' => 'Waitlist',
            'singular_name' => 'Waitlist signup',
            'menu_name' => 'Waitlist',
            'add_new_item' => 'Add signup',
            'edit_item' => 'View signup',
            'search_items' => 'Search waitlist',
            'not_found' => 'No signups yet',
            'all_items' => 'All signups',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_position' => 26,
        'menu_icon' => 'dashicons-email-alt',
        'supports' => ['title'],
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'show_in_rest' => false,
    ]);
}
add_action('init', 'grippy_waitlist_register_cpt');

/**
 * REST: POST /wp-json/grippy/v1/waitlist  { "email": "..." }
 * Auth: Application Password (user must be able to edit posts).
 */
function grippy_waitlist_register_rest()
{
    register_rest_route('grippy/v1', '/waitlist', [
        'methods' => 'POST',
        'callback' => 'grippy_waitlist_create_signup',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
        'args' => [
            'email' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_email',
            ],
        ],
    ]);
}
add_action('rest_api_init', 'grippy_waitlist_register_rest');

function grippy_waitlist_create_signup(WP_REST_Request $request)
{
    $email = strtolower(sanitize_email((string) $request->get_param('email')));

    if (!$email || !is_email($email)) {
        return new WP_Error(
            'invalid_email',
            'Please enter a valid email address.',
            ['status' => 400]
        );
    }

    $existing = get_posts([
        'post_type' => GRIPPY_WAITLIST_CPT,
        'post_status' => 'private',
        'posts_per_page' => 1,
        'meta_key' => '_grippy_waitlist_email',
        'meta_value' => $email,
        'fields' => 'ids',
    ]);

    if (!empty($existing)) {
        return rest_ensure_response([
            'ok' => true,
            'alreadyJoined' => true,
        ]);
    }

    $post_id = wp_insert_post(
        [
            'post_type' => GRIPPY_WAITLIST_CPT,
            'post_title' => $email,
            'post_status' => 'private',
        ],
        true
    );

    if (is_wp_error($post_id)) {
        return new WP_Error(
            'create_failed',
            $post_id->get_error_message(),
            ['status' => 500]
        );
    }

    update_post_meta($post_id, '_grippy_waitlist_email', $email);
    update_post_meta($post_id, '_grippy_waitlist_created_at', gmdate('c'));

    return rest_ensure_response([
        'ok' => true,
        'id' => $post_id,
    ]);
}

/**
 * Admin list: show email + signup date columns.
 */
function grippy_waitlist_columns($columns)
{
    return [
        'cb' => $columns['cb'] ?? '',
        'title' => 'Email',
        'created' => 'Signed up',
    ];
}
add_filter('manage_' . GRIPPY_WAITLIST_CPT . '_posts_columns', 'grippy_waitlist_columns');

function grippy_waitlist_column_content($column, $post_id)
{
    if ($column === 'created') {
        $meta = get_post_meta($post_id, '_grippy_waitlist_created_at', true);
        echo esc_html($meta ? $meta : get_the_date('c', $post_id));
    }
}
add_action('manage_' . GRIPPY_WAITLIST_CPT . '_posts_custom_column', 'grippy_waitlist_column_content', 10, 2);
