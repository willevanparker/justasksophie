function getReplyText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    for (const outputItem of data.output) {
      if (typeof outputItem.text === "string" && outputItem.text.trim()) {
        return outputItem.text.trim();
      }

      if (!Array.isArray(outputItem.content)) continue;

      for (const contentItem of outputItem.content) {
        if (typeof contentItem.text === "string" && contentItem.text.trim()) {
          return contentItem.text.trim();
        }

        if (
          contentItem.type === "output_text" &&
          typeof contentItem.output_text === "string" &&
          contentItem.output_text.trim()
        ) {
          return contentItem.output_text.trim();
        }

        if (
          contentItem.type === "text" &&
          typeof contentItem.content === "string" &&
          contentItem.content.trim()
        ) {
          return contentItem.content.trim();
        }
      }
    }
  }

  if (Array.isArray(data.choices)) {
    for (const choice of data.choices) {
      const content = choice.message?.content;

      if (typeof content === "string" && content.trim()) {
        return content.trim();
      }

      if (Array.isArray(content)) {
        for (const contentItem of content) {
          if (typeof contentItem.text === "string" && contentItem.text.trim()) {
            return contentItem.text.trim();
          }
        }
      }
    }
  }

  return "";
}

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
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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

    const reply = getReplyText(data);

    if (!reply) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Sorry, Sophie had trouble reading that answer. Please try again."
        })
      };
    }

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
