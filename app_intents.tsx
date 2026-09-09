import { AppIntentManager, AppIntentProtocol } from "scripting"

// 复制 PinPlus 记录的 AppIntent
const CopyPinItemIntent = AppIntentManager.register({
  name: "CopyPinItem",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (text: string) => {
    try {
      await Pasteboard.setString(text)
      await Haptics.transient(0.3, 0.5)
    } catch (e) {
      console.error("Copy failed:", e)
    }
  },
})

export { CopyPinItemIntent }