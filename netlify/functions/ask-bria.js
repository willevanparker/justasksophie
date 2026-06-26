exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Please ask Bria a question." })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing OpenAI API key in Netlify."
        })
      };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You are Bria, an approachable AI sommelier. You help everyday people understand wine without intimidation. You remember the current conversation and understand references like 'there', 'that wine', 'the first one', and 'what about that region' based on prior messages. Answer clearly, warmly, and practically. Help with wine pairings, grapes, regions, labels, serving temperature, shopping, gifts, and beginner wine questions. When recommending wine, be specific about grape, region, style, food pairing, and a reasonable price range when helpful. Avoid snobbery. Keep answers concise unless the user asks for detail. Do not claim to be a certified sommelier. Encourage responsible drinking when relevant."
          },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error:
            data.error?.message ||
            "Sorry, Bria had trouble answering that. Please try again."
        })
      };
    }

    const reply =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "Sorry, I had trouble answering that. Try again?";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Sorry, Bria had trouble connecting. Please try again in a moment."
      })
    };
  }
};
