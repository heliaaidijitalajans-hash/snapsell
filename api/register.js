export default function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  res.status(200).json({
    success: true
    user: data
  });

}
    return res.status(405).json({
          eror: "Method Not Allowed"

   });

}
