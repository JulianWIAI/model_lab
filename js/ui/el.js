/**
 * Small helper for building DOM elements in code.
 *
 *   el('button', { class: 'btn', text: 'Go', onClick: handler }, [child1, child2])
 *
 * - class    sets className
 * - text     sets textContent (safe: never parsed as HTML)
 * - onXxx    adds an event listener for "xxx"
 * - anything else becomes an attribute; false/null/undefined are skipped
 *
 * @param {string} tag
 * @param {Record<string, any>} props
 * @param {(Node|string|null|undefined|false)[]|Node|string} children
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of [].concat(children)) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child);
  }
  return node;
}
