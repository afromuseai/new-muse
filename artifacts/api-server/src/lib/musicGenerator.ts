export async function generateMusic(prompt: string) {
  const res = await fetch(`${process.env.MUSIC_API_URL}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MUSIC_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error("Music generation failed");
  }

  return await res.json(); 
}