import { VStack, HStack, Text, Widget, Script, Spacer, Button } from "scripting"
import { CopyPinItemIntent } from "./app_intents"

interface Item {
  text: string
  pinned: boolean
  timestamp: number
}

function getItems(): Item[] {
  const raw = Storage.get<Item[]>("pinplus_items")
  if (!raw) return []
  return raw
}

function ItemButton(props: { item: Item }) {
  const { item } = props
  return (
    <Button
      intent={CopyPinItemIntent(item.text)}
      padding={{ leading: 8, trailing: 8, top: 6, bottom: 6 }}
      buttonStyle="borderless"
    >
      <HStack spacing={6} alignment="center">
        {item.pinned && <Text font="caption2" foregroundStyle={"orange" as any}>{"📌"}</Text>}
        <Text font="caption" foregroundStyle="label" lineLimit={1}>{item.text}</Text>
        <Spacer />
        <Text font="caption2" foregroundStyle="blue">{"复制"}</Text>
      </HStack>
    </Button>
  )
}

function SmallWidgetView() {
  const items = getItems()
  const pinned = items.filter(i => i.pinned).slice(0, 3)

  if (pinned.length === 0) {
    return (
      <VStack alignment="center" spacing={4} padding={12}>
        <Text font="caption" foregroundStyle="secondaryLabel">{"📌 PinPlus"}</Text>
        <Text font="caption2" foregroundStyle="tertiaryLabel">{"暂无固定"}</Text>
      </VStack>
    )
  }

  return (
    <VStack alignment="leading" spacing={4} padding={10}>
      <HStack alignment="center">
        <Text font="caption" bold>{"📌 PinPlus"}</Text>
        <Spacer />
        <Text font="caption2" foregroundStyle="tertiaryLabel">{`${pinned.length}条`}</Text>
      </HStack>
      {pinned.map((item) => (
        <ItemButton key={item.text + item.timestamp} item={item} />
      ))}
    </VStack>
  )
}

function MediumWidgetView() {
  const items = getItems()
  const displayItems = items.slice(0, 5)

  if (displayItems.length === 0) {
    return (
      <VStack alignment="center" spacing={4} padding={14}>
        <Text font="caption" foregroundStyle="secondaryLabel">{"📌 PinPlus"}</Text>
        <Text font="caption2" foregroundStyle="tertiaryLabel">{"暂无记录"}</Text>
      </VStack>
    )
  }

  return (
    <VStack alignment="leading" spacing={4} padding={12}>
      <HStack alignment="center">
        <Text font="caption" bold>{"📌 PinPlus"}</Text>
        <Spacer />
        <Text font="caption2" foregroundStyle="tertiaryLabel">{`${items.length}条`}</Text>
      </HStack>
      <VStack spacing={2}>
        {displayItems.map((item) => (
          <ItemButton key={item.text + item.timestamp} item={item} />
        ))}
      </VStack>
    </VStack>
  )
}

function LargeWidgetView() {
  const items = getItems()
  const pinned = items.filter(i => i.pinned)
  const unpinned = items.filter(i => !i.pinned)
  const displayItems = [...pinned, ...unpinned].slice(0, 8)

  if (displayItems.length === 0) {
    return (
      <VStack alignment="center" spacing={6} padding={16}>
        <Text font="caption" foregroundStyle="secondaryLabel">{"📌 PinPlus"}</Text>
        <Text font="caption2" foregroundStyle="tertiaryLabel">{"暂无记录，下拉刷新可添加"}</Text>
      </VStack>
    )
  }

  return (
    <VStack alignment="leading" spacing={6} padding={14}>
      <HStack alignment="center">
        <Text font="caption" bold>{"📌 PinPlus 剪贴板"}</Text>
        <Spacer />
        <Text font="caption2" foregroundStyle="tertiaryLabel">{`${items.length}条记录`}</Text>
      </HStack>

      {pinned.length > 0 && (
        <VStack spacing={2}>
          <Text font="caption2" foregroundStyle={"orange" as any}>{"📌 固定"}</Text>
          {pinned.slice(0, 4).map((item) => (
            <ItemButton key={item.text + item.timestamp} item={item} />
          ))}
        </VStack>
      )}

      {unpinned.length > 0 && (
        <VStack spacing={2}>
          <Text font="caption2" foregroundStyle="secondaryLabel">{"📋 最近"}</Text>
          {unpinned.slice(0, 4).map((item) => (
            <ItemButton key={item.text + item.timestamp} item={item} />
          ))}
        </VStack>
      )}
    </VStack>
  )
}

function PinPlusWidget() {
  const family = Widget.family

  if (family === "systemSmall") {
    return <SmallWidgetView />
  } else if (family === "systemLarge") {
    return <LargeWidgetView />
  }
  return <MediumWidgetView />
}

Widget.present(<PinPlusWidget />, {
  policy: "after",
  date: new Date(Date.now() + 1000 * 60 * 5),
})

Script.exit()

export default PinPlusWidget