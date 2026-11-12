import React from 'react';
export function Link({href='/',...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>){
  return <a href={href.startsWith('/')?'#'+href.slice(1):href} {...props}/>;
}
