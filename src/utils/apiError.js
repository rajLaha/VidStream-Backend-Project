class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const catchError = (error, res) => {
  console.log(error.stack);
  return res
    .status(error.statusCode || 500)
    .json(`Something went wrong Error: ${error.message}`);
};

export { ApiError, catchError };
