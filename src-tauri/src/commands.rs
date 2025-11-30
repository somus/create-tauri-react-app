// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
#[specta::specta]
pub fn greet(name: &str) -> Result<String, String> {
    log::debug!("greet command called with name: {}", name);

    // Validation: check if name is empty
    if name.trim().is_empty() {
        log::warn!("greet command received empty name");
        return Err("Name cannot be empty".to_string());
    }

    // Validation: check length (basic example)
    if name.len() > 100 {
        log::warn!("greet command received name too long: {} chars", name.len());
        return Err("Name is too long (max 100 characters)".to_string());
    }

    // Sanitization: trim whitespace
    let sanitized_name = name.trim();
    log::info!("Successfully greeted: {}", sanitized_name);

    // Success case
    Ok(format!(
        "Hello, {}! You've been greeted from Rust!",
        sanitized_name
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_success() {
        let result = greet("World");
        assert!(result.is_ok());
        assert_eq!(
            result.unwrap(),
            "Hello, World! You've been greeted from Rust!"
        );
    }

    #[test]
    fn test_greet_empty_name() {
        let result = greet("");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Name cannot be empty");
    }

    #[test]
    fn test_greet_whitespace_only() {
        let result = greet("   ");
        assert!(result.is_err());
    }

    #[test]
    fn test_greet_too_long() {
        let long_name = "a".repeat(101);
        let result = greet(&long_name);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("too long"));
    }

    #[test]
    fn test_greet_trims_whitespace() {
        let result = greet("  Bob  ");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Hello, Bob! You've been greeted from Rust!");
    }
}
