export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(status).json({
    success: false,
    message: isProduction && status === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
  });
};
