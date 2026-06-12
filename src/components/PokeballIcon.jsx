/* Pokeball icon — extracted 1:1 from the deployed site bundle
   (https://ryanperera.github.io/pokeroulette/): 7x7 pixel-art SVG,
   pink top half, drawn pixel-by-pixel with crisp edges. */
export default function PokeballIcon({ size = 12, style }) {
  return (
    <svg width={size} height={size} viewBox="6 6 7 7"
      style={{
        imageRendering: 'pixelated', shapeRendering: 'crispEdges',
        flexShrink: 0, display: 'block', ...style,
      }}>
      <rect width="1" height="1" x="8" y="6" fill="#000" />
      <rect width="1" height="1" x="9" y="6" fill="#000" />
      <rect width="1" height="1" x="10" y="6" fill="#000" />
      <rect width="1" height="1" x="7" y="7" fill="#000" />
      <rect width="1" height="1" x="8" y="7" fill="#d04888" />
      <rect width="1" height="1" x="9" y="7" fill="#d04888" />
      <rect width="1" height="1" x="10" y="7" fill="#d04888" />
      <rect width="1" height="1" x="11" y="7" fill="#000" />
      <rect width="1" height="1" x="6" y="8" fill="#000" />
      <rect width="1" height="1" x="7" y="8" fill="#d04888" />
      <rect width="1" height="1" x="8" y="8" fill="#000" />
      <rect width="1" height="1" x="9" y="8" fill="#000" />
      <rect width="1" height="1" x="10" y="8" fill="#d04888" />
      <rect width="1" height="1" x="11" y="8" fill="#d04888" />
      <rect width="1" height="1" x="12" y="8" fill="#000" />
      <rect width="1" height="1" x="6" y="9" fill="#000" />
      <rect width="1" height="1" x="7" y="9" fill="#000" />
      <rect width="1" height="1" x="8" y="9" fill="#000" />
      <rect width="1" height="1" x="9" y="9" fill="#fff" />
      <rect width="1" height="1" x="10" y="9" fill="#000" />
      <rect width="1" height="1" x="11" y="9" fill="#000" />
      <rect width="1" height="1" x="12" y="9" fill="#000" />
      <rect width="1" height="1" x="6" y="10" fill="#000" />
      <rect width="1" height="1" x="7" y="10" fill="#fff" />
      <rect width="1" height="1" x="8" y="10" fill="#fff" />
      <rect width="1" height="1" x="9" y="10" fill="#000" />
      <rect width="1" height="1" x="10" y="10" fill="#000" />
      <rect width="1" height="1" x="11" y="10" fill="#fff" />
      <rect width="1" height="1" x="12" y="10" fill="#000" />
      <rect width="1" height="1" x="7" y="11" fill="#000" />
      <rect width="1" height="1" x="8" y="11" fill="#fff" />
      <rect width="1" height="1" x="9" y="11" fill="#fff" />
      <rect width="1" height="1" x="10" y="11" fill="#fff" />
      <rect width="1" height="1" x="11" y="11" fill="#000" />
      <rect width="1" height="1" x="8" y="12" fill="#000" />
      <rect width="1" height="1" x="9" y="12" fill="#000" />
      <rect width="1" height="1" x="10" y="12" fill="#000" />
    </svg>
  )
}
