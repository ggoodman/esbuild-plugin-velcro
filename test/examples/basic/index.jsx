import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';

const Hello = () => <h1>Hello world</h1>;

export function render() {
  return ReactDOMServer.renderToString(<Hello />);
}
