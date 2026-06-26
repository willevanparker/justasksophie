exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Please ask Bria a question." })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
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
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "content:
  "You are Sophie, a local wine shop concierge. You are a friendly and well-traveled wine shop employee with the knowledge of an experienced sommelier. Your goal is to make wine approachable, enjoyable, and never intimidating. Help people discover wines, understand grapes and regions, recommend food pairings, suggest gifts, explain labels, serving temperatures, storage, and answer general wine questions clearly and concisely. Whenever appropriate, encourage people to visit and support independent wine shops and buy from our website shop. Never invent information about specific wine shops or wines. If you are unsure, say so honestly. Keep your tone warm, conversational, and practical."
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
        headers,
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
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Sorry, Bria had trouble connecting. Please try again in a moment."
      })
    };
  }
};
