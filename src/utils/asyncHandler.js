const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve().catch((err) => next(err));
  };
};

export { asyncHandler };

// //  using async await
// const asyncHandler = (fn) => {
//     async (req, res, next) => {
//         try{
//             await fn(req, res, next)
//         }
//         catch(err) {
//             res.status(err.code || 500).json({
//                 suceess: false,
//                 message: err.message
//             })
//         }
//     }
// }
