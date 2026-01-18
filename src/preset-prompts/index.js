import appearanceAssessment from "./fun/appearance-assessment.js"
import facial_analysis from "./fun/facial-analysis.js"
import gtei from "./fun/gtei.js"
import linux_prompt from "./fun/linux-prompt.js"

import codealyzer from "./coding/codealyzer.js"
import exploitation from "./coding/exploitation.js"

import analysis from "./analysis.js"
import eli5 from "./eli5.js"
import extract_and_infer from "./extract-and-infer.js"
import general from "./general.js"
import geolocation from "./geolocation.js"
import art_prompter from "./gfx/art_prompter.js"
import ltx2videoprompt from "./gfx/ltx2-video-prompt.js"
import idea_feedback from "./idea-feedback.js"
import llm_prompt_enhance from "./llm-prompt-enhance.js"
import llm_prompt from "./llm-prompt.js"
import retort from "./retort.js"
import summarize from "./summarize.js"
import summary_meeting from "./summary-meeting.js"
import translate from "./translate.js"

const GENERAL_PROMPTS = {
    analysis,
    eli5,
    extract_and_infer,
    general,
    geolocation,
    idea_feedback,
    llm_prompt,
    llm_prompt_enhance,
    retort,
    summarize,
    summary_meeting,
    translate,
}

const GFX_PROMPTS = {
    art_prompter,
    ltx2videoprompt,
}

const CODING_PROMPTS = {
    codealyzer,
    exploitation,
}

const FUN_PROMPTS = {
    appearanceAssessment,
    facial_analysis,
    linux_prompt,
    gtei,
}

export default {
    default: GENERAL_PROMPTS,
    coding: CODING_PROMPTS,
    fun: FUN_PROMPTS,
    gfx: GFX_PROMPTS,
}