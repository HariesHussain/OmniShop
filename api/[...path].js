export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    catchAll: true,
    message: "Catch-all route working"
  });
}