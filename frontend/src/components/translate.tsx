'use client'
import { TOptions, TFunction } from "i18next";
import { useTranslation } from "react-i18next"
import { ComponentPropsWithoutRef, ElementType, Fragment, ReactNode, useMemo } from 'react';

interface TranslateTextProps extends TOptions {
    /**
   * Capitalize the first letter of the translation
   * @default false
   */
    capitalize?: boolean;
}

/** client-side only */
export function translateText<T = any>(t: TFunction<"translation", T>, value: string, op: TranslateTextProps = {}) {
    let text = t(value, op);
    if (op.capitalize) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    return text
}

const DefaultComponent = 'span';
type BaseProps<C extends ElementType> = ComponentPropsWithoutRef<C>;
type OmittedProps<C extends ElementType> = Omit<BaseProps<C>, 'children' | 'key'>;
interface TranslateProps<C extends ElementType = typeof DefaultComponent> {
    /**
     * Translation key
     */
    value: string;

    /**
     * Custom component or HTML tag to render
     * @default 'span'
     */
    as?: C;

    /**
     * Children to render when translation is empty
     */
    fallback?: ReactNode;
    /**
   * Capitalize the first letter of the translation
   * @default false
   */
    capitalize?: boolean;
    /**
     * translate options
     */
    options?: TOptions
    /**
     * if have placeholder {{}} or {}
     * will be replace to children
     */
    children?: ReactNode;
    /**
     * 
     */
    t?: TFunction<"translation", any>
}

type FullTranslateProps<C extends ElementType = typeof DefaultComponent> =
    TranslateProps<C> & OmittedProps<C>;

export function Translate<C extends ElementType = typeof DefaultComponent>({
    t = useTranslation().t,
    as,
    value,
    fallback,
    options,
    capitalize,
    children,
    ...props
}: FullTranslateProps<C>) {
    const Component = as || DefaultComponent;

    const text = useMemo(() => {
        let text = t(value, options)

        if (!text && fallback) {
            return fallback;
        }

        if (capitalize) {
            text = text.charAt(0).toUpperCase() + text.slice(1)
        }

        const parts = text.split(/({{.*?}}|\{.*?\})/);

        return parts.map((part, i) =>
            part.match(/{{.*?}}|\{.*?\}/) ? (
                <Fragment key={i}>{children}</Fragment>
            ) : part
        );
    }, [t, value, options, fallback, capitalize, children]);

    return <Component {...props}>{text}</Component>
}
