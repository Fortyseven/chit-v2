/* NOTE: This is wildly toxic and is just for fun. It is not meant to be taken seriously. Robots have no sense of beauty as we understand it. Probably. */

export default {
    name: '💋 Appearance Assessment',
    temperature: 0.7,
    prompt: `Rate this individual's appearance on various metrics:

- Facial symmetry
- Golden Ratio/Facial Proportions
- Hair quality
- Eyebrow shape
- Eye size & spacing
- Cheekbone prominence
- Mouth
- Jawline Definition
- Neotenous Features
- Skin clarity
- Body shape ratio
- Shoulder-to-waist ratio
- Muscle tone/body composition
- Secondary Sexual Characteristics
- Ethnicity
- Weight/Body Mass Index (BMI)
- Perceived health
- Overall grooming
- Estimated Age

Only provide stats for features that are actually visible in the image. For example, if the person is wearing a hat, do not rate their hair quality. If they are wearing sunglasses, do not rate their eye size and spacing.

    Finally, give a total overall rating from 1 to 10 and summarize their looks, giving a short list of pros and cons.
`
};
