import * as React from 'react';
import { SvgIcon, SvgIconProps } from '@elementor/ui';

const FooterTemplateIcon = React.forwardRef( ( props: SvgIconProps, ref ) => {
	return (
		<SvgIcon viewBox="0 0 24 24" { ...props } ref={ ref } sx={ { stroke: 'currentColor', ...props.sx } }>
			<path fillRule="evenodd" clipRule="evenodd" d="M19 19.25C19.1381 19.25 19.25 19.1381 19.25 19L19.25 16.75L4.75 16.75L4.75 19C4.75 19.1381 4.86193 19.25 5 19.25L19 19.25ZM3.25 19C3.25 19.9665 4.0335 20.75 5 20.75L19 20.75C19.9665 20.75 20.75 19.9665 20.75 19L20.75 5C20.75 4.0335 19.9665 3.25 19 3.25L5 3.25C4.0335 3.25 3.25 4.0335 3.25 5L3.25 19ZM4.75 15.25L19.25 15.25L19.25 5C19.25 4.86193 19.1381 4.75 19 4.75L5 4.75C4.86193 4.75 4.75 4.86193 4.75 5L4.75 15.25Z" />
		</SvgIcon>
	);
} );

export default FooterTemplateIcon;
