import { formatINR } from '../utils/format.js'

export default function WorkItems({ items }) {
  return (
    <ul className="work-items">
      {items.map((item, i) => (
        <li key={i} className="work-item">
          <span className="work-item-name">{item.description}</span>
          <span className="work-item-amount">{formatINR(item.amount)}</span>
        </li>
      ))}
    </ul>
  )
}
