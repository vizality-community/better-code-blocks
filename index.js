import React from 'react';

import { getReactInstance } from '@vizality/util/react';
import { patch, unpatch } from '@vizality/patcher';
import { CodeBlock } from '@vizality/components';
import { getModule } from '@vizality/webpack';
import { Plugin } from '@vizality/entities';

export default class BetterCodeBlocks extends Plugin {
  start () {
    this.patchCodeBlocks();
  }

  stop () {
    unpatch('better-code-blocks-inline');
    unpatch('better-code-blocks-embed');
    this._forceUpdate();
  }

  patchCodeBlocks () {
    const parser = getModule('parse', 'parseTopic');
    patch('better-code-blocks-inline', parser.defaultRules.codeBlock, 'react', (args, res) => {
      this.injectCodeBlock(args, res);
      return res;
    });
    this._forceUpdate();
  }

  injectCodeBlock (args, codeblock) {
    const { render } = codeblock?.props;
    codeblock.props.render = codeblock => {
      let lang, content, contentIsRaw, res;
      if (!args) {
        res = render(codeblock);
        lang = res?.props?.children?.props?.className?.split(' ')?.find(className => !className.includes('-') && className !== 'hljs');
        if (res?.props?.children?.props?.children) {
          content = res.props.children.props.children;
        } else {
          content = res?.props?.children?.props?.dangerouslySetInnerHTML?.__html;
          contentIsRaw = true;
        }
      } else {
        [ { lang, content } ] = args;
      }

      res =
        <CodeBlock
          language={lang}
          content={content}
          contentIsRaw={contentIsRaw}
          hasWrapper={false}
        />;

      return res;
    };
  }

  _forceUpdate () {
    /*
     * @todo Make this better.
     * @note Some messages don't have onMouseMove, so check for that first.
     */
    document.querySelectorAll(`[id^='chat-messages-']`).forEach(e =>
      Boolean(getReactInstance(e)?.memoizedProps?.onMouseMove) && getReactInstance(e).memoizedProps.onMouseMove()
    );
  }
}
