export const validators = {
  required(message = "This field is required") {
    return (value) =>
      String(value ?? "").trim()
        ? ""
        : message;
  },

  minLength(
    length,
    message = `Must be at least ${length} characters`
  ) {
    return (value) =>
      String(value ?? "").trim().length >= length
        ? ""
        : message;
  },

  maxLength(
    length,
    message = `Must be ${length} characters or fewer`
  ) {
    return (value) =>
      String(value ?? "").trim().length <= length
        ? ""
        : message;
  },

  email(message = "Enter a valid email") {
    return (value) => {
      const text =
        String(value ?? "").trim();

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? ""
        : message;
    };
  },

  oneOf(
    allowed,
    message = "Choose a valid option"
  ) {
    return (value) =>
      allowed.includes(value)
        ? ""
        : message;
  },
};

export function validateField(
  value,
  rules = []
) {
  for (const rule of rules) {
    const error = rule(value);

    if (error) {
      return error;
    }
  }

  return "";
}

export function validateForm(
  values,
  schema
) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error =
      validateField(
        values[field],
        rules
      );

    if (error) {
      errors[field] = error;
    }
  }

  return {
    errors,
    isValid:
      Object.keys(errors).length === 0,
  };
}
