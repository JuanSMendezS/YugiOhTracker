import type { ReactNode } from 'react'

type CatalogItemCardProps = {
  variant?: 'rich' | 'compact'
  imageUrl?: string
  imageAlt?: string
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  description?: ReactNode
  footer?: ReactNode
}

function CatalogItemCard({
  variant = 'compact',
  imageUrl,
  imageAlt,
  title,
  subtitle,
  meta,
  description,
  footer,
}: CatalogItemCardProps) {
  return (
    <article className={`catalog-item catalog-item--${variant}`}>
      {imageUrl && (
        <img
          className="catalog-item__image"
          src={imageUrl}
          alt={imageAlt ?? 'Imagen'}
          loading="lazy"
        />
      )}

      <div className="catalog-item__content">
        <header className="catalog-item__head">
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </header>

        {meta ? <div className="catalog-item__meta">{meta}</div> : null}
        {description ? <p className="catalog-item__desc">{description}</p> : null}
        {footer ? <div className="catalog-item__footer">{footer}</div> : null}
      </div>
    </article>
  )
}

export default CatalogItemCard
