package com.tmdt.config;

import org.springframework.context.annotation.Configuration;

/**
 * Environment variables are now loaded in TmdtApplication.main()
 * before Spring context starts, ensuring @Value annotations resolve correctly.
 * This class is kept for backward compatibility but no longer loads .env.
 */
@Configuration
public class EnvConfig {
    // .env loading moved to TmdtApplication.loadDotenv()
}
