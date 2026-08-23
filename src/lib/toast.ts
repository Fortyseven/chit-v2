import { toast } from "@zerodevx/svelte-toast"

export default (msg: string) => toast.push(msg)

export function toastError(msg: string) {
    toast.push(msg, {
        theme: {
            "--toastBackground": "var(--toastErrorBackground)",
            "--toastBarBackground": "var(--toastErrorBarBackground)",
            "--toastColor": "var(--toastErrorColor)",
        },
    })
}
