// 示例图片的生成任务：与网站同一套暖色、低反差、柔和漫射光的视觉风格。
// name：文件名（应用截图测试按这些名字读取，见 README）；size：请求的尺寸；aspect：裁剪比例；width：输出宽度；
// refs：参考图（先生成的任务名），有参考图时用图像编辑接口，保持同一个人。

const product =
  'Photorealistic minimal e-commerce product photo for a calm, warm, editorial lookbook. ' +
  'Soft, even, diffused daylight with a very soft, short contact shadow; low contrast; true-to-life colours; ' +
  'natural fabric texture and fine details in sharp focus. ' +
  'No people, no hands, no hangers, no mannequins, no props, no text, no logos, no brand labels, no watermark.'

const backdrops = {
  sage: 'pale sage green (#E3E9DE)',
  blush: 'pale blush pink (#F1E1DA)',
  stone: 'warm light grey (#ECE8E2)',
  mist: 'pale misty blue-grey (#E2E6EC)',
  sand: 'warm sand beige (#EEE4D8)',
  butter: 'pale butter cream (#F3EBD6)',
}

const flatLay = (item, bg) =>
  `Overhead flat-lay photo, shot from directly above, of ${item}, neatly laid out and centered, ` +
  `shown small enough that the entire garment, including both sleeves or legs, is fully visible and touches no edge of the frame: ' +
  'wide empty margins of at least 15% of the frame on the left, right, top and bottom. Seamless matte ${backdrops[bg]} paper background. ${product}`

const standing = (item, bg, view) =>
  `Studio product photo of ${item}, ${view}, centered and fully visible with wide empty margins on all sides, on a seamless matte ${backdrops[bg]} paper background ` +
  `that curves smoothly into the floor. ${product}`

const people =
  'Photorealistic full-length fashion catalogue photo with a calm, minimal, warm editorial mood. ' +
  'Lighting: soft, even, diffused light, like bright overcast daylight or a large softbox directly in front at face height with fill light; ' +
  'the whole face is evenly and brightly lit, with natural skin and natural catchlights; low overall contrast, no dramatic lighting. ' +
  'Natural relaxed pose, standing facing the camera with arms relaxed at the sides. ' +
  'The whole body from head to feet is in frame, centered, with some space above the head and below the feet. ' +
  'No text, no logos, no watermark.'

const studio = 'Seamless warm off-white studio backdrop (#F3EDE6) with a soft, subtle floor shadow.'
const same = 'Image 1 shows a woman. Create a new photo of the same woman — same face, hairstyle, skin tone and body proportions —'

const her =
  'a young East Asian woman in her mid-20s with shoulder-length straight dark brown hair, natural light make-up and a gentle relaxed smile'

export const jobs = [
  // 衣物
  { name: 'tee', size: '1024x1536', aspect: [3, 4], width: 720, prompt: flatLay('a plain white crew-neck short-sleeve cotton T-shirt', 'sage') },
  { name: 'dress', size: '1024x1536', aspect: [2, 3], width: 720, prompt: flatLay('a burgundy (wine red) midi slip dress with thin spaghetti straps, a small cream-and-mustard floral print and a softly flared skirt', 'blush') },
  { name: 'sneaker', size: '1024x1024', aspect: [1, 1], width: 720, prompt: standing('a pair of black low-top canvas sneakers with white rubber soles, white toe caps and white laces, standing side by side', 'stone', 'three-quarter side view at shoe height; the pair is small in the frame, occupying only about 60% of its width, with empty background on both sides') },
  { name: 'jeans', size: '1024x1536', aspect: [3, 4], width: 720, prompt: flatLay('a pair of dark indigo straight-leg jeans with subtle copper top-stitching, laid flat, front view', 'mist') },
  { name: 'coat', size: '1024x1536', aspect: [3, 4], width: 720, prompt: flatLay('a camel double-breasted wool overcoat with notch lapels, two rows of dark brown buttons and flap pockets, mid-calf length, sleeves laid straight along the sides', 'sand') },
  { name: 'hat', size: '1536x1024', aspect: [4, 3], width: 720, prompt: standing('a beige woven straw bucket hat with a narrow black ribbon band', 'butter', 'three-quarter view from slightly above') },
  { name: 'shirt', size: '1024x1536', aspect: [4, 5], width: 720, prompt: flatLay('a light blue oxford cotton long-sleeve button-down shirt, buttoned, with a chest pocket, sleeves laid straight along the sides', 'stone') },
  { name: 'bag', size: '1024x1024', aspect: [1, 1], width: 720, prompt: standing('a caramel brown smooth leather tote bag with two top handles and subtle edge stitching, standing upright', 'sand', 'front view at eye level') },

  // 模特形象（我、妈妈）
  {
    name: 'look1', size: '1024x1536', aspect: [3, 4], width: 660, focusY: 0.5,
    prompt: `${people} ${studio} The model is ${her}. She wears a plain white crew-neck cotton T-shirt tucked into dark indigo straight-leg jeans, an unbuttoned light blue oxford shirt worn open over the T-shirt, and black low-top canvas sneakers with white soles.`,
  },
  {
    name: 'look3', size: '1024x1536', aspect: [3, 4], width: 660,
    prompt: `${people} ${studio} The model is an East Asian woman in her early 50s with a short chin-length dark bob and a warm, kind smile. She wears a burgundy midi dress with a small cream floral print and a softly flared skirt, a beige woven straw bucket hat with a narrow black band, and beige flat shoes.`,
  },

  // 试穿记录与三视图（以“我”为准）
  {
    name: 'look2', size: '1024x1536', aspect: [3, 4], width: 660, refs: ['look1'],
    prompt: `${same} wearing a camel double-breasted wool overcoat buttoned over a burgundy midi dress, dark brown leather ankle boots, and carrying a caramel leather tote bag in her right hand. ${people} ${studio}`,
  },
  {
    name: 'look2_side', size: '1024x1536', aspect: [3, 4], width: 660, refs: ['look2'],
    prompt: `Image 1 is a front view of a woman. Create the side view of the same woman in exactly the same outfit, accessories and hairstyle: a full-length right side profile — her body and face turned 90 degrees so she faces the right edge of the frame — standing naturally with arms relaxed. Same backdrop, lighting, framing and figure size as Image 1. No text, no logos, no watermark.`,
  },
  {
    name: 'look2_back', size: '1024x1536', aspect: [3, 4], width: 660, refs: ['look2'],
    prompt: `Image 1 is a front view of a woman. Create the back view of the same woman in exactly the same outfit, accessories and hairstyle: a full-length view from directly behind, standing naturally with arms relaxed. Same backdrop, lighting, framing and figure size as Image 1. No text, no logos, no watermark.`,
  },

  // AI 试穿图（2:3）：浅色背景与深色背景各一张，检查「AI生成」标识的明暗适配
  {
    name: 'ai_light', size: '1024x1536', aspect: [2, 3], width: 600, refs: ['look1'],
    prompt: `${same} wearing the light blue oxford button-down shirt neatly tucked into dark indigo straight-leg jeans, with black low-top canvas sneakers. ${people} ${studio}`,
  },
  {
    name: 'ai_dark', size: '1024x1536', aspect: [2, 3], width: 600, refs: ['look1'],
    prompt: `${same} wearing a burgundy midi slip dress with thin straps and a small cream floral print, with a beige woven straw bucket hat. ${people} Seamless dark charcoal studio backdrop (#2E2A27) with a soft floor shadow; the soft frontal light keeps her evenly lit against the dark background.`,
  },
]
