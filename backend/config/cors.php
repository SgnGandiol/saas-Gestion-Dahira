<?php

return [
    'paths' => ['api/*', 'graphql', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Production non-wildcard entries added here
    ],

    // Matches any subdomain of sgd.sn + localhost variants for dev
    'allowed_origins_patterns' => [
        '#^https?://[a-z0-9\-]+\.sgd\.sn$#',
        '#^https?://[a-z0-9\-]+\.localhost(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,
];
