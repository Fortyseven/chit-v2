import { Style } from "svelte-google-materialdesign-icons";

export default {
    name: 'BBox2D template',
    temperature: 0.2,
    icon: Style,
    prompt: `
        Return results in a JSON array with the following structure for each element:
        {"bbox_2d": [451, 553, 486, 735], "label": "label"}
`
};
