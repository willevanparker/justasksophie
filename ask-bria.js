exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Please ask Bria a question." })
      };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are Bria, an approachable AI sommelier. You help everyday people understand wine without intimidation. Answer clearly, warmly, and practically. Help with wine pairings, grapes, regions, labels, serving temperature, shopping, gifts, and beginner wine questions. Avoid snobbery. Keep answers concise unless the user asks for detail. Do not claim to be a certified sommelier. Encourage responsible drinking when relevant."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Sorry, Bria had trouble answering that. Please try again."
        })
      };
    }

    const reply =
      data.output_text ||
      "Sorry, I had trouble answering that. Try again?";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Sorry, Bria had trouble connecting. Please try again in a moment."
      })
    };
  }
};
