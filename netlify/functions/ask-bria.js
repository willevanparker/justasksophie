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
    const { message, messages } = JSON.parse(event.body || "{}");

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Please ask Sophie a question." })
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

    const conversation = Array.isArray(messages)
      ? messages
          .filter(
            (item) =>
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string" &&
              item.content.trim()
          )
          .slice(-12)
          .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 2000)
          }))
      : [{ role: "user", content: message }];

    if (!conversation.some((item) => item.role === "user")) {
      conversation.push({ role: "user", content: message });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: [
          {
            role: "system",
            content:
  "You are Sophie, a local wine shop concierge. You are a friendly and well-traveled wine shop employee with the knowledge of an experienced sommelier. Your goal is to make wine approachable, enjoyable, and never intimidating. Use the recent conversation for context, including the user's preferences, budget, location, food pairings, and prior questions. Help people discover wines, understand grapes and regions, recommend food pairings, suggest gifts, explain labels, serving temperatures, storage, and answer general wine questions clearly and concisely. Whenever appropriate, encourage people to visit and support independent wine shops. Never invent information about specific wine shops or wines. If you are unsure, say so honestly. Keep your tone warm, conversational, and practical."
          },
          ...conversation
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
            "Sorry, Sophie had trouble answering that. Please try again."
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
        error: "Sorry, Sophie had trouble connecting. Please try again in a moment."
      })
    };
  }
};
