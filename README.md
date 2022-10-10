Markdown Viewer for Hiking Context
==================================

## The Goal

-  A viewer suitable for Hiking Context.
-  Not to over-extend the syntax of markdown, but preffer to render properly from the get hints of the context

## Document Extension

### Document header

  > The first H1 Header is as the document title, possibly with the date 'YYYY-MM-DD'.

### Table of Contents

  > Include H2~H4

## Context Improvement

### Predefined Section Header Name

- 待辦事項
- 天氣預報
- 文件
- 地圖
- 預計行程
- 備案行程
- 實際行程
- 行程記錄
- 後記
- 行程資訊
- 交通
- 住宿
- 參考記錄
- 參考行程

###  Altitude Extension

> A number surrounding with `*`, for example, `*3884*`.

### Time Extension

> Time string surronding with `` ` ``, for example, `` `0630` ``, acceptable formats:
| Format     | Example    | Cond  |
| :--------- | :--------- | :---: |
| HHMM       | 0630       | &#96; |
| HHMM~MM    | 0630~40    | &#96; |
| HHMM~HHMM  | 0630~0640  | &#96; |
| MMm        | 10m        | &#96; |
| YYYY-MM-DD | 2022-07-10 |  No   |

### Weather Extension

The weather name surronding with `()`, acceptable names are `晴`, `風`, `陰`, `雷`, `雨`, `變`, `霧`, `雪`.

### Legend-Arrow Extension

Show the legend-arrow `-(LEGEND)->` in proper way.

### Vehicle Extension (in `交通資訊` section)

~~Anything surronding with `{}` will be highlighted, for example, `{台灣好行6732(東埔-水里)}`.~~
Deprecated. Replaced by Mark tag.

### Map Extension (in `地圖` section)

Embedding the map page with the format `{map:<ID>}`, for example, `{map:trekkr}`.

### Record Brief Extension (in `預計行程`, `備案行程`, and `實際行程` sections)

- **Expected format**: D1 XXX->YYY->ZZZ.
- (optional) **Day Header**: `D` with a number.
- (must) **Path**: locations concatenating with `->` without spaces around.

### Record Content Extension (in `行程記錄`, and `參考記錄` sections)

If the record content is rendered as a table:
- Embellish the table
- Column 1 should be timestamp, so tagged as `<time>`.

Normal improvement
------------------

### Andhor Extension

Open links in the new tabs.

### SVG extension

Use `<object>` to load svg, instead of `<img>`, to get more interaction.

### Image extension

Wrapping with `<figure>` and add `<figcaption>` by 'alt' if provided.
