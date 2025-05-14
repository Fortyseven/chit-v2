import analysis from "./analysis.js"
import appearanceAssessment from "./fun/appearance-assessment.js"
import codealyzer from "./codealyzer.js"
import eli5 from "./eli5.js"
import extract_and_infer from "./extract-and-infer.js"
import facial_analysis from "./fun/facial-analysis.js"
import linux_prompt from "./fun/linux-prompt.js"
import general from "./general.js"
import geolocation from "./geolocation.js"
import retort from "./retort.js"
import sdprompt from "./sdprompt.js"
import summarize from "./summarize.js"
import summary_meeting from "./summary-meeting.js"
import translate from "./translate.js"

export const SYSTEM_PROMPTS = {
    analysis,
    codealyzer,
    eli5,
    extract_and_infer,
    general,
    geolocation,
    retort,
    sdprompt,
    summarize,
    summary_meeting,
    translate,
}

export const FUN_PROMPTS = {
    appearanceAssessment
    facial_analysis,
    linux_prompt,
}