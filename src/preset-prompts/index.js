import appearanceAssessment from "./fun/appearance-assessment.js"
import facial_analysis from "./fun/facial-analysis.js"
import gtei from "./fun/gtei.js"
import linux_prompt from "./fun/linux-prompt.js"

import analysis from "./analysis.js"
import art_prompter from "./art_prompter.js"
import codealyzer from "./codealyzer.js"
import eli5 from "./eli5.js"
import extract_and_infer from "./extract-and-infer.js"
import general from "./general.js"
import geolocation from "./geolocation.js"
import idea_feedback from "./idea-feedback.js"
import llm_prompt from "./llm-prompt.js"
import retort from "./retort.js"
import summarize from "./summarize.js"
import summary_meeting from "./summary-meeting.js"
import translate from "./translate.js"

export const SYSTEM_PROMPTS = {
    analysis,
    art_prompter,
    codealyzer,
    eli5,
    extract_and_infer,
    general,
    geolocation,
    idea_feedback,
    llm_prompt,
    retort,
    summarize,
    summary_meeting,
    translate,
}

export const FUN_PROMPTS = {
    appearanceAssessment,
    facial_analysis,
    linux_prompt,
    gtei,
}
