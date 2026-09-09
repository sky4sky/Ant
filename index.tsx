// ===== 更新说明检查（脚本管理工具注入，勿删） =====
;(async () => {
  try {
    const note = "1、适配组件\n2、增加Scripting首页"
    if (!note) return
    const version = "1.0.2"
    const scriptName = "PinPlus"
    const folderName = "PinPlus"
    if (!version) return
    const scriptAuthor = "coo11"
    const notifyAuthor = true
    const publishId = "p1787666817268-22358"
    const base = FileManager.appGroupDocumentsDirectory || ""
    if (!base) return
    // 记录历史更新说明（changelog_history/{scriptName}.json，按版本号降序，最多 20 条，同版本去重）
    const histDir = base + "/changelog_history"
    try { await FileManager.createDirectory(histDir, true) } catch (e) {}
    const histPath = histDir + "/" + scriptName + ".json"
    let history: { version: string; note: string }[] = []
    try {
      const raw = JSON.parse(await FileManager.readAsString(histPath))
      if (Array.isArray(raw)) history = raw
    } catch (e) {}
    try {
      history = history.filter((h) => h && h.version !== version)
      history.push({ version, note })
      const verNums = (v: string) => {
        const p = String(v || "").split(".").map((n) => parseInt(n, 10) || 0)
        while (p.length < 3) p.push(0)
        return p
      }
      history.sort((a, b) => {
        const pa = verNums(a.version)
        const pb = verNums(b.version)
        for (let i = 0; i < 3; i++) {
          if (pa[i] !== pb[i]) return pb[i] - pa[i]
        }
        return 0
      })
      history = history.slice(0, 20)
      await FileManager.writeAsString(histPath, JSON.stringify(history))
    } catch (e) {}
    const seenDir = base + "/changelog_seen"
    try { await FileManager.createDirectory(seenDir, true) } catch (e) {}
    const statePath = seenDir + "/" + scriptName + ".json"
    let seen: Record<string, boolean> = {}
    try { seen = JSON.parse(await FileManager.readAsString(statePath)) || {} } catch (e) {}
    if (seen[version]) return
    // 作者本人不提示：本机脚本管理工具发布过该版本（本机即作者/发布者设备），或设置里填写的用户名与脚本作者一致，
    // 且本次发布未勾选「作者本人也提示更新」时，不弹更新说明
    try {
      const mgrCfgPath = base + "/script-manager-config.json"
      const mgrCfg = JSON.parse(await FileManager.readAsString(mgrCfgPath)) || {}
      const mgrName = String(mgrCfg.authorName || "").trim()
      const published = mgrCfg.publishedVersions || {}
      if (!notifyAuthor && ((scriptAuthor && mgrName && mgrName === scriptAuthor) || published[folderName] === version)) {
        return
      }
    } catch (e) {}
    // 同一发布实例只提示一次（按 版本号@发布序号 去重）：即使版本号一致，重新发布也会重新提示
    const seenKey = version + "@" + publishId
    if (seen[seenKey]) return
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 600))
    const { Navigation, NavigationStack, ScrollView, VStack, HStack, Text, Button, Divider, Spacer, Image, useState } = await import("scripting")
    const markSeen = async () => {
      try {
        seen[seenKey] = true
        await FileManager.writeAsString(statePath, JSON.stringify(seen))
      } catch (e) {}
    }
    function ChangelogView(props: { note: string; version: string; scriptName: string; history: { version: string; note: string }[] }) {
      const dismiss = Navigation.useDismiss()
      const [pageIndex, setPageIndex] = useState(0)
      const total = props.history.length
      const current = total > 0 ? props.history[Math.min(pageIndex, total - 1)] : null
      const atFirst = pageIndex <= 0
      const atLast = pageIndex >= total - 1
      const navButton = (icon: string, label: string, disabled: boolean, action: () => void) => (
        <VStack
          spacing={3}
          alignment="center"
          frame={{ width: 48, height: 52 }}
          background={{ style: { color: "label", opacity: 0.08 }, shape: { type: "rect", cornerRadius: 12 } }}
          contentShape={{ kind: "interaction", shape: "rect" }}
          onTapGesture={() => { if (!disabled) action() }}
        >
          <Image systemName={icon} foregroundStyle={disabled ? "secondaryLabel" : "tintColor"} />
          <Text font="caption2" foregroundStyle={disabled ? "secondaryLabel" : "tintColor"}>{label}</Text>
        </VStack>
      )
      return (
        <NavigationStack>
          <VStack navigationTitle={props.scriptName + " · 更新说明"} navigationBarTitleDisplayMode="inline" navigationBarBackButtonHidden spacing={0}>
            {total === 0 ? (
              <VStack alignment="center" spacing={8} padding={32} frame={{ maxHeight: "infinity" }}>
                <Text font="subheadline" foregroundStyle="secondaryLabel">暂无历史更新记录</Text>
              </VStack>
            ) : current ? (
              <>
                <HStack alignment="center" padding={{ top: 14, horizontal: 16, bottom: 10 }}>
                  <Text font="headline" bold>版本 {current.version}</Text>
                  <Spacer />
                  <Text font="caption2" foregroundStyle="secondaryLabel">第 {pageIndex + 1} / {total} 页</Text>
                </HStack>
                <Divider />
                <ScrollView frame={{ maxHeight: "infinity" }}>
                  <VStack alignment="leading" spacing={10} padding={{ horizontal: 16, bottom: 16 }}>
                    <Text font="body" multilineTextAlignment="leading">{current.note}</Text>
                  </VStack>
                </ScrollView>
              </>
            ) : null}
            <Divider />
            <VStack spacing={12} alignment="center" padding={{ horizontal: 16, vertical: 12 }} background={{ style: { color: "secondarySystemBackground", opacity: 0.95 }, shape: { type: "rect", cornerRadius: 20 } }}>
              <HStack spacing={10} alignment="center" padding={{ horizontal: 10, vertical: 8 }}>
                {navButton("backward.end.fill", "首页", atFirst, () => setPageIndex(0))}
                {navButton("chevron.left", "上页", atFirst, () => setPageIndex(pageIndex - 1))}
                {navButton("chevron.right", "下页", atLast, () => setPageIndex(pageIndex + 1))}
                {navButton("forward.end.fill", "尾页", atLast, () => setPageIndex(total - 1))}
              </HStack>
              <HStack spacing={12} alignment="center" padding={{ horizontal: 6, vertical: 2 }}>
                <Button action={() => { markSeen(); dismiss() }} buttonStyle="bordered" controlSize="large">
                  <Text font="footnote" foregroundStyle="secondaryLabel">此版不再显示</Text>
                </Button>
                <Button action={() => dismiss()} buttonStyle="borderedProminent" controlSize="large">
                  <Text font="footnote" bold>稍候再看说明</Text>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </NavigationStack>
      )
    }
    await Navigation.present({
      element: <ChangelogView note={note} version={version} scriptName={scriptName} history={history} />,
    })
  } catch (e) {}
})();
// ===== 更新说明检查结束 =====



import {
  VStack,
  HStack,
  Text,
  Button,
  Section,
  List,
  Navigation,
  NavigationStack,
  Script,
  modifiers,
  useEffect,
  useState,
  Spacer,
} from "scripting"

// Dialog, Pasteboard, Haptics, ShareSheet, Storage, Safari are global

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

function addItem(text: string) {
  if (!text || text.trim() === "") return
  const lines = text.split("\n").map(s => s.trim()).filter(s => s.length > 0)
  if (lines.length === 0) return
  const items = getItems()
  for (const line of lines) {
    const idx = items.findIndex(i => i.text === line)
    if (idx >= 0) items.splice(idx, 1)
    items.unshift({ text: line, pinned: false, timestamp: Date.now() })
  }
  saveItems(items)
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

// ==================== 分词词典 ====================
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

// ==================== 分词视图 ====================
function SegmentView({ text, onDismiss }: { text: string; onDismiss: () => void }) {
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

// ==================== 主应用 ====================
function PinPlusApp() {
  const dismiss = Navigation.useDismiss()
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    setItems(getItems())
  }, [])

  async function pasteFromClipboard() {
    const text = await Pasteboard.getString()
    if (text && text.trim()) {
      addItem(text)
      setItems(getItems())
      await Haptics.transient(0.3, 0.5)
    } else {
      Dialog.alert({ title: "提示", message: "剪贴板无内容", buttonLabel: "我知道了" })
    }
  }

  async function handleRefresh() {
    await Haptics.transient(0.3, 0.5)
    const text = await Pasteboard.getString()
    if (text && text.trim()) {
      addItem(text)
      setItems(getItems())
    }
  }

  async function handleDelete(index: number) {
    const item = items[index]
    if (item.pinned) {
      await Dialog.alert({ title: "无法删除", message: "请先取消固定", buttonLabel: "确定" })
      return
    }
    const idx = await Dialog.actionSheet({
      title: "确认删除？",
      actions: [{ label: "取消" }, { label: "删除", destructive: true }],
    })
    if (idx === 1) {
      removeItem(index)
      setItems(getItems())
    }
  }

  async function handleShare(text: string) { await ShareSheet.present([text]) }

  async function handleClearAll() {
    const idx = await Dialog.actionSheet({
      title: "确认清空所有记录？",
      actions: [{ label: "取消" }, { label: "清空全部", destructive: true }],
    })
    if (idx === 1) {
      Storage.set("pinplus_items", [])
      setItems([])
    }
  }

  function handleTogglePin(index: number) {
    togglePin(index)
    setItems(getItems())
    Haptics.transient(0.3, 0.5)
  }

  function handleSegment(text: string) {
    Navigation.present({
      element: <SegmentView text={text} onDismiss={() => {}} />,
    })
  }

  function doSearch(text: string) {
    Safari.openURL(`https://duckduckgo.com/?q=${encodeURIComponent(text)}`)
  }

  function doTranslate(text: string) {
    Safari.openURL(`https://translate.deepl.com/translator#zh-CN/en/${encodeURIComponent(text)}`)
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="PinPlus"
        navigationBarTitleDisplayMode="inline"
        refreshable={handleRefresh}
        toolbar={{
          topBarLeading: <Button title="粘贴" systemImage="doc.on.clipboard" action={pasteFromClipboard} />,
          topBarTrailing: [
            <Button title="清空" systemImage="trash" role="destructive" action={handleClearAll} key="clear" />,
            <Button title="关闭" systemImage="xmark.circle" action={() => { dismiss(); Script.exit() }} key="close" />,
          ],
        }}
      >
        <Section title="记录">
          {items.length > 0 ? (
            items.map((item, index) => (
              <HStack
                key={item.text + item.timestamp}
                alignment="center"
                spacing={8}
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
                    <Button title={item.pinned ? "取消固定" : "固定"} systemImage={item.pinned ? "pin.slash" : "pin"} tint={item.pinned ? "orange" : "secondaryLabel"} action={() => handleTogglePin(index)} />,
                    <Button title="分词" systemImage="text.word" tint="accentColor" action={() => handleSegment(item.text)} />,
                    <Button title="分享" systemImage="square.and.arrow.up" action={() => handleShare(item.text)} />,
                    <Button title="删除" systemImage="trash" role="destructive" action={() => handleDelete(index)} disabled={item.pinned} />,
                  ],
                }}
              >
                <Text
                  styledText={{ font: "body", content: item.text }}
                  modifiers={modifiers().foregroundStyle("label").lineLimit(2)}
                />
                <Spacer />
                {item.pinned && <Text styledText={{ font: "caption2", content: "📌" }} />}
              </HStack>
            ))
          ) : (
            <Text styledText={{ font: "caption", content: "下拉刷新可自动添加剪贴板内容" }} modifiers={modifiers().foregroundStyle("tertiaryLabel")} />
          )}
        </Section>
      </List>
    </NavigationStack>
  )
}

Navigation.present({ element: <PinPlusApp /> })