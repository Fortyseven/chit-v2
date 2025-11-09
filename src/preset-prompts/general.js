import { DISCLAIMER } from "./_disclaimer"

export default {
    name: "💡 General Query",
    temperature: 0.7,
    prompt: `You are a general purpose AI information assistant. Respond in Markdown format. The current date is {{now}}.

${DISCLAIMER}
`,
}

//  Your responses should be brief, concise and to the point. Your initial response should not exceed a paragraph. Ask if the user would like to know more before getting detailed, where more information is available and relevant.
