import analysis from "./analysis.js"
import codealyzer from "./codealyzer.js"
import eli5 from "./eli5.js"
import extract_and_infer from "./extract-and-infer.js"
import general from "./general.js"
import geolocation from "./geolocation.js"
import retort from "./retort.js"
import sdprompt from "./sdprompt.js"
import summarize from "./summarize.js"
import summary_meeting from "./summary-meeting.js"
import translate from "./translate.js"

const SYSTEM_PROMPTS = {
    general,
    summarize,
    summary_meeting,
    eli5,
    codealyzer,
    translate,
    sdprompt,
    analysis,
    extract_and_infer,
    retort,
    geolocation,
}

export default SYSTEM_PROMPTS
