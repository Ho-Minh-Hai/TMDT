package com.tmdt;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TmdtApplication {

	public static void main(String[] args) {
		// Load .env BEFORE Spring context initializes,
		// so @Value("${SUPABASE_URL}") etc. resolve correctly.
		loadDotenv();
		SpringApplication.run(TmdtApplication.class, args);
	}

	private static void loadDotenv() {
		try {
			// Try multiple paths to find .env file
			String[] possiblePaths = {
				System.getProperty("user.dir") + "/be",           // When running from parent dir
				System.getProperty("user.dir"),                   // When running from be dir
				System.getProperty("user.dir") + "/../be",        // Relative path
				new java.io.File("").getAbsolutePath() + "/be"    // JAR location + be folder
			};
			
			Dotenv dotenv = null;
			String loadedFrom = null;
			
			for (String path : possiblePaths) {
				try {
					java.io.File envFile = new java.io.File(path, ".env");
					if (envFile.exists()) {
						dotenv = Dotenv.configure()
								.directory(path)
								.ignoreIfMissing()
								.load();
						
						// Check if we actually loaded something
						if (dotenv != null && dotenv.get("SUPABASE_URL") != null) {
							loadedFrom = path;
							System.out.println("✓ .env loaded from: " + path);
							break;
						}
					}
				} catch (Exception e) {
					// Continue to next path
				}
			}
			
			if (dotenv == null || loadedFrom == null) {
				System.err.println("✗ WARNING: .env file not found in any of the expected paths!");
				System.err.println("  Searched: ");
				for (String path : possiblePaths) {
					System.err.println("    - " + path);
				}
				return;
			}
			
			// Load all properties from .env into System properties
			dotenv.entries().forEach(entry -> {
				String key = entry.getKey();
				String value = entry.getValue();
				if (System.getProperty(key) == null && value != null) {
					System.setProperty(key, value);
					if (key.contains("SUPABASE")) {
						System.out.println("  → Loaded: " + key);
					}
				}
			});
			
		} catch (Exception e) {
			System.err.println("✗ Error loading .env file: " + e.getMessage());
			e.printStackTrace();
		}
	}
}
