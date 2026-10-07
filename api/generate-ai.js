export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { image, style = "chibi" } = req.body || {};

    if (!image) {
      return res.status(400).json({
        error: "Foto tidak ditemukan"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY belum dipasang di Vercel"
      });
    }

    
      const prompts = {
  
    chibi:
  "Transform the person in this photo into a high-quality cute 3D chibi character. Preserve the person's recognizable facial features, hairstyle, glasses, clothing colors, gender, and identity. Randomly choose full body, three-quarter body composition and use a natural fun pose. Use a bright, fresh, cheerful outdoor garden background with vivid blue sky, soft fluffy white clouds, lush green trees, colorful flowers, soft natural daylight, and a clean happy atmosphere. Add subtle cute decorative scenery in the distant background, but keep the person as the main subject.. DO NOT use dark backgrounds, black backgrounds, night scenes, brown tones, dark orange tones, gloomy lighting, or moody colors. The overall image must look bright, clean, colorful, cute, happy, and professional."

 
    };

    const prompt = prompts[style] || prompts.chibi;

    // Ambil base64 murni
    const base64 = image.includes(",")
      ? image.split(",")[1]
      : image;

    const bytes = Buffer.from(base64, "base64");

    // Buat file gambar untuk multipart/form-data
    const blob = new Blob([bytes], {
      type: "image/jpeg"
    });

    const form = new FormData();

    form.append("model", "gpt-image-1");
    form.append("image", blob, "photo.jpg");
    form.append("prompt", prompt);
    form.append("size", "1024x1536");

    const response = await fetch(
      "https://api.openai.com/v1/images/edits",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: form
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "AI generation gagal"
      });
    }

    const result = data?.data?.[0];

    if (!result) {
      return res.status(500).json({
        error: "AI tidak mengembalikan gambar"
      });
    }

    // Bisa menerima base64 maupun URL
    if (result.b64_json) {
      return res.status(200).json({
        image: result.b64_json
      });
    }

    if (result.url) {
      return res.status(200).json({
        imageUrl: result.url
      });
    }

    return res.status(500).json({
      error: "Format hasil AI tidak dikenali"
    });

  } catch (error) {
    console.error("generate-ai error:", error);

    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
