export const newElement = (tag, { ...attrs }, ...children) => {
  const elem = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    elem[key] = value;
  }

  const newChildren = children.map(child => {
    return typeof child === 'object'
      ? child
      : document.createTextNode(child);
  })

  elem.append(...newChildren);

  return elem;
};

export const removeChildrenFromElement = (element) => {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
}

export const formatDateForDB = (date) => {
  return date.split('-').reverse().join('.');
}

export const formatDateForDatepicker = (date) => {
  return date.split('.').reverse().join('-');
}