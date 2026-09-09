import { useState, useEffect, VStack, HStack, Text, Spacer, Button, List, Section, NavigationStack, Navigation, Script, modifiers } from "scripting"

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

function saveItems(items: Item[]) {
  Storage.set("pinplus_items", items)
}

function removeItem(index: number) {
  const items = getItems()
  items.splice(index, 1)
  saveItems(items)
}

function togglePin(index: number) {
  const items = getItems()
  items[index].pinned = !items[index].pinned
  items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.timestamp - a.timestamp
  })
  saveItems(items)
}

async function copyToClipboard(text: string) {
  await Pasteboard.setString(text)
  await Haptics.transient(0.3, 0.5)
}

function doSearch(text: string) {
  Safari.openURL(`https://duckduckgo.com/?q=${encodeURIComponent(text)}`)
}

function doTranslate(text: string) {
  Safari.openURL(`https://translate.deepl.com/translator#zh-CN/en/${encodeURIComponent(text)}`)
}

function doSegment(text: string) {
  Navigation.present({
    element: <SegmentView text={text} onDismiss={() => {}} />,
  })
}

function SegmentView({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  const DIC = [
    "我们", "你们", "他们", "她们", "它们",
    "这个", "那个", "这些", "那些", "这里", "那里", "哪里",
    "因为", "所以", "但是", "然而", "虽然", "如果", "然后", "怎样", "怎么", "为什么",
    "电脑", "手机", "电视", "电影", "音乐", "图片", "视频", "照片",
    "今天", "明天", "昨天", "现在", "以前", "以后", "之前", "之后",
    "吃饭", "睡觉", "工作", "学习", "生活", "时间", "地方", "事情",
    "非常", "特别", "十分", "极其", "比较", "相当", "更加",
    "的时候", "的样子", "的话",
    "一下", "一直", "已经", "曾经", "刚刚", "突然", "忽然",
    "欢迎", "使用", "注意", "知道", "发现", "觉得", "认为",
    "可以", "能够", "应该", "需要", "愿意", "希望",
    "北京", "上海", "广州", "深圳", "中国", "美国", "日本",
    "天气", "温度", "下雨", "下雪", "晴天", "阴天",
    "开心", "高兴", "快乐", "难过", "生气", "害怕",
    "漂亮", "好看", "好吃", "好喝", "好玩",
    "为什么", "怎么样", "怎么办",
    "好奇心", "注意力", "记忆力", "想象力",
    "年轻人", "老年人",
    "虽然", "尽管", "就算", "哪怕",
    "事实上", "实际上", "基本上", "一般来说",
    "条目", "向右", "滑动", "加上", "搜索", "按钮", "每个", "字词",
    "复制", "固定", "分享", "删除", "翻译", "分词", "关闭", "清空",
    "粘贴", "刷新", "记录", "剪贴板", "内容", "文本",
    "自然", "语言", "习惯", "显示", "间隔", "增大",
    "成功", "失败", "无法", "提示", "确定", "取消",
    "打开", "浏览器", "默认", "系统",
    "进入", "退出", "返回", "开始", "结束",
    "第一", "第二", "第三", "最后",
    "上面", "下面", "左边", "右边", "中间",
    "里面", "外面",
    "中文", "英文", "数字", "标点",
    "词语", "单词", "词组", "句子",
    "单个", "多个", "全部", "部分",
    "点击", "长按", "滑动", "左滑", "右滑",
    "自动", "手动", "默认", "自定义",
    "添加", "移除", "清空", "重置",
    "保存", "加载", "读取", "写入",
    "网络", "连接", "服务", "数据",
    "结果", "信息", "内容", "文本",
    "当前", "历史", "最新", "旧的",
    "常用", "常见", "一般", "特殊",
    "重要", "主要", "次要", "核心",
    "基本", "基础", "高级", "初级",
    "简单", "复杂", "容易", "困难",
    "快速", "慢速", "正常", "异常",
    "正确", "错误", "对的", "错的",
    "好的", "坏的", "新的", "旧的",
    "大的", "小的", "高的", "低的",
    "长的", "短的", "宽的", "窄的",
    "深的", "浅的", "深色", "浅色",
    "亮的", "暗的", "明的",
    "红色", "蓝色", "绿色", "黄色",
    "橙色", "紫色", "粉色", "灰色",
    "黑色", "白色", "棕色", "青色",
  ]

  function segmentText(text: string): string[] {
    const result: string[] = []
    let i = 0
    while (i < text.length) {
      const ch = text[i]
      const isCn = /[\u4e00-\u9fff]/.test(ch)
      const isPunct = /[\s，。！？、；：""''（）【】《》〈〉…—·.,;:!?\'\"(){}<>[\]\\\\/]/.test(ch)
      if (isPunct) { result.push(ch); i++; continue }
      if (!isCn) {
        let j = i
        while (j < text.length && !/[\s，。！？、；：""''（）【】《》〈〉…—·.,;:!?\'\"(){}<>[\]\\\\/]/.test(text[j]) && !/[\u4e00-\u9fff]/.test(text[j])) j++
        result.push(text.slice(i, j)); i = j; continue
      }
      let matched = ""
      for (let len = Math.min(4, text.length - i); len >= 2; len--) {
        const word = text.slice(i, i + len)
        if (DIC.includes(word)) { matched = word; break }
      }
      if (matched) { result.push(matched); i += matched.length }
      else { result.push(text[i]); i++ }
    }
    return result
  }

  const parts = segmentText(text)
  const displayText = parts.join("   ")

  return (
    <NavigationStack>
      <List
        navigationTitle="分词"
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarTrailing: <Button title="关闭" systemImage="xmark.circle" action={onDismiss} />,
        }}
      >
        <VStack alignment="leading" spacing={16} modifiers={modifiers().padding({ horizontal: 16, vertical: 16 })}>
          <Text
            styledText={{ font: "body", content: displayText }}
            modifiers={modifiers().foregroundStyle("label").lineLimit(0)}
            contextMenu={{
              menuItems: (
                <>
                  <Section>
                    {parts.map((part, i) => (
                      <Button key={i} title={part} action={async () => { await copyToClipboard(part) }} />
                    ))}
                  </Section>
                </>
              ),
            }}
          />
        </VStack>
      </List>
    </NavigationStack>
  )
}

export default function HomeScreenDefaultUI() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    setItems(getItems())
  }, [])

  useEffect(() => {
    const off = Script.onHomeTabEvent(event => {
      if (event === "selected" || event === "reselected") {
        setItems(getItems())
      }
    })
    return off
  }, [])

  const handleRefresh = async () => {
    const text = await Pasteboard.getString()
    if (text && text.trim()) {
      const lines = text.split("\n").map(s => s.trim()).filter(s => s.length > 0)
      const existing = getItems()
      for (const line of lines) {
        const idx = existing.findIndex(i => i.text === line)
        if (idx >= 0) existing.splice(idx, 1)
        existing.unshift({ text: line, pinned: false, timestamp: Date.now() })
      }
      saveItems(existing)
      setItems(getItems())
      await Haptics.transient(0.3, 0.5)
    }
  }

  const handleTogglePin = (index: number) => {
    togglePin(index)
    setItems(getItems())
    Haptics.transient(0.3, 0.5)
  }

  const handleDelete = (index: number) => {
    const item = items[index]
    if (item.pinned) {
      Dialog.alert({ title: "无法删除", message: "请先取消固定", buttonLabel: "确定" })
      return
    }
    removeItem(index)
    setItems(getItems())
  }

  const handleCopy = async (text: string) => {
    await copyToClipboard(text)
  }

  const pinnedItems = items.filter(i => i.pinned)
  const unpinnedItems = items.filter(i => !i.pinned)

  return (
    <NavigationStack>
      <List navigationTitle="PinPlus" navigationBarTitleDisplayMode="inline" refreshable={handleRefresh}>
        <Section header={<HStack spacing={8} alignment="center">
          <Text font="subheadline" bold>{"📌 固定"}</Text>
          <Spacer />
          <Text font="caption" foregroundStyle="secondaryLabel">{`${pinnedItems.length}条`}</Text>
        </HStack>}>
          {pinnedItems.length > 0 ? (
            pinnedItems.map((item) => (
              <HStack
                key={item.text + item.timestamp}
                alignment="center"
                spacing={8}
                padding={4}
                leadingSwipeActions={{
                  allowsFullSwipe: false,
                  actions: [
                    <Button title="翻译" systemImage="globe" tint="accentColor" action={() => doTranslate(item.text)} />,
                    <Button title="搜索" systemImage="magnifyingglass" tint="accentColor" action={() => doSearch(item.text)} />,
                  ],
                }}
                trailingSwipeActions={{
                  allowsFullSwipe: false,
                  actions: [
                    <Button title={item.pinned ? "取消固定" : "固定"} systemImage={item.pinned ? "pin.slash" : "pin"} tint={item.pinned ? "orange" : "secondaryLabel"} action={() => {
                      const realIndex = items.findIndex(i => i.text === item.text && i.timestamp === item.timestamp)
                      if (realIndex >= 0) handleTogglePin(realIndex)
                    }} />,
                    <Button title="分词" systemImage="text.word" tint="accentColor" action={() => doSegment(item.text)} />,
                    <Button title="分享" systemImage="square.and.arrow.up" action={() => { ShareSheet.present([item.text]) }} />,
                    <Button title="删除" systemImage="trash" role="destructive" action={() => {
                      const realIndex = items.findIndex(i => i.text === item.text && i.timestamp === item.timestamp)
                      if (realIndex >= 0) handleDelete(realIndex)
                    }} disabled={item.pinned} />,
                  ],
                }}
              >
                <Text
                  styledText={{ font: "body", content: item.text }}
                  modifiers={modifiers().foregroundStyle("label").lineLimit(2)}
                />
                <Spacer />
                <Text styledText={{ font: "caption2", content: "📌" }} />
              </HStack>
            ))
          ) : (
            <Text font="caption" foregroundStyle="secondaryLabel">{"暂无固定记录"}</Text>
          )}
        </Section>

        <Section header={<HStack spacing={8} alignment="center">
          <Text font="subheadline" bold>{"📋 全部记录"}</Text>
          <Spacer />
          <Text font="caption" foregroundStyle="secondaryLabel">{`${unpinnedItems.length}条`}</Text>
        </HStack>}>
          {unpinnedItems.length > 0 ? (
            unpinnedItems.map((item) => (
              <HStack
                key={item.text + item.timestamp}
                alignment="center"
                spacing={8}
                padding={4}
                leadingSwipeActions={{
                  allowsFullSwipe: false,
                  actions: [
                    <Button title="翻译" systemImage="globe" tint="accentColor" action={() => doTranslate(item.text)} />,
                    <Button title="搜索" systemImage="magnifyingglass" tint="accentColor" action={() => doSearch(item.text)} />,
                  ],
                }}
                trailingSwipeActions={{
                  allowsFullSwipe: false,
                  actions: [
                    <Button title="固定" systemImage="pin" tint="secondaryLabel" action={() => {
                      const realIndex = items.findIndex(i => i.text === item.text && i.timestamp === item.timestamp)
                      if (realIndex >= 0) handleTogglePin(realIndex)
                    }} />,
                    <Button title="分词" systemImage="text.word" tint="accentColor" action={() => doSegment(item.text)} />,
                    <Button title="分享" systemImage="square.and.arrow.up" action={() => { ShareSheet.present([item.text]) }} />,
                    <Button title="删除" systemImage="trash" role="destructive" action={() => {
                      const realIndex = items.findIndex(i => i.text === item.text && i.timestamp === item.timestamp)
                      if (realIndex >= 0) handleDelete(realIndex)
                    }} />,
                  ],
                }}
              >
                <Text
                  styledText={{ font: "body", content: item.text }}
                  modifiers={modifiers().foregroundStyle("label").lineLimit(2)}
                />
                <Spacer />
                <Button
                  title="复制"
                  systemImage="doc.on.doc"
                  tint="blue"
                  buttonStyle="borderless"
                  padding={{ leading: 8, trailing: 8, top: 4, bottom: 4 }}
                  action={() => handleCopy(item.text)}
                />
              </HStack>
            ))
          ) : (
            <Text font="caption" foregroundStyle="secondaryLabel">{"暂无记录，下拉刷新可添加"}</Text>
          )}
        </Section>
      </List>
    </NavigationStack>
  )
}