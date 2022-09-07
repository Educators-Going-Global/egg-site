require("dotenv").config();
const contentful = require("contentful");
const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: process.env.CTFL_SPACE,
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: process.env.CTFL_ACCESSTOKEN,
});

const { documentToHtmlString } = require("@contentful/rich-text-html-renderer");

const imageProcessing = (photo) => {
  return `
    <img class='u-max-full-width'
      srcset="https:${photo.fields.file.url}?w=480&fm=webp&q=80&fit=fill&f=faces 480w,
      https:${photo.fields.file.url}?w=800&fm=webp&q=80&fit=fill&f=faces 800w" sizes="(max-width: 600px) 480px,800px"
      src="https:${photo.fields.file.url}?w=480&fit=fill&f=faces"
      alt="${photo.fields.title}" loading="lazy"
    >`;
};

const richTextOptions = {
  renderNode: {
    "embedded-asset-block": (node) =>
      `<img class="content-image" src="${node.data.target.fields.file.url}"/>`,
  },
};

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("style");
  eleventyConfig.addWatchTarget("style");

  eleventyConfig.addShortcode("documentToHtmlString", documentToHtmlString);
  eleventyConfig.addShortcode("imageProcessing", imageProcessing);

  eleventyConfig.addShortcode("bannerBlock", (bannerBlock) => {
    return `
      <header
        id="${bannerBlock.fields.sectionLink}"
        class="banner-base ${
          !!bannerBlock.fields.background ? "banner-base--hero" : ""
        }" style="background-image: url('${
      bannerBlock.fields.background?.fields.file.url
    }')">
        <h1 class="banner-title">${bannerBlock.fields.sectionTitle}</h1>
        <div class="banner-content">
          ${documentToHtmlString(bannerBlock.fields.content, richTextOptions)}
        </div>
      </header>
    `;
  });

  eleventyConfig.addShortcode("footerBlock", (footerBlock) => {
    return `
      <section id="footer">
        <div class="inner">
          <div class="copyright">
            ${documentToHtmlString(footerBlock.fields.content, richTextOptions)}
          </div>
        </div>
      </section>`;
  });

  eleventyConfig.addShortcode("contentBlock", (contentBlock) => {
    return `
      <section id="${contentBlock.fields.sectionLink}">
        <div class="wrapper">
          <div class="inner">
            <h3 class="major">${contentBlock.fields.sectionTitle}</h3>
            <div>
              ${documentToHtmlString(
                contentBlock.fields.content,
                richTextOptions
              )}
            </div>
          </div>
        </div>
      </section>`;
  });

  eleventyConfig.addShortcode("featuretteBlock", (featuretteBlock) => {
    return `
      <div class="podcast">
        <h3 class="podcast-title">${featuretteBlock.fields.title}</h1>
        <p class="podcast-author">${featuretteBlock.fields.author}</p>
        <p class="podcast-date">${featuretteBlock.fields.datePosted}</p>
        <a class="podcast-image podcast-image${featuretteBlock.fields.imageLeft ? '--left' : '--right'}">
          ${imageProcessing(featuretteBlock.fields.image)}
        </a>
        <div id="buzzsprout-player-${featuretteBlock.fields.episodeId}"></div>
        <script src="${featuretteBlock.fields.episodeSrc}" type="text/javascript" charset="utf-8"></script>
        <p class="podcast-description">
          ${documentToHtmlString(featuretteBlock.fields.description, richTextOptions)}
        </p>
      </div>
    `;
  });

  eleventyConfig.addShortcode("cardBlock", async (cardBlock) => {
    const output = await Promise.all(
      cardBlock.fields.cards.map(({ sys }) => {
        return (cards = client.getEntry(sys.id).then((card) => {
          return `
            <article>
              <a href="#" class="image">
                ${imageProcessing(card.fields.image)}
              </a>
              <h3 class="major">
                ${card.fields.sectionTitle}
              </h3>
              ${documentToHtmlString(card.fields.content, richTextOptions)}
            </article>`;
        }));
      })
    );
    return `
      <section id="${cardBlock.fields.sectionLink}" class="wrapper alt style1">
        <div class="inner">
          <h2 class="major">
            ${cardBlock.fields.sectionTitle}
          </h2>
          <section class="card">
            ${output.join("")}
          </section>
        </div>
      </section>`;
  });

  eleventyConfig.addShortcode("imageCarousel", async (imageCarousel) => {
    const output = await Promise.all(
      imageCarousel.fields.content.map(({ sys }) => {
        return (items = client.getEntry(sys.id).then((item) => {
          if (imageCarousel.fields.usesCards) {
            return `
              <article>
                <a href="#" class="image">
                  ${imageProcessing(item.fields.image)}
                </a>
                <h3 class="major">
                  ${item.fields.sectionTitle}
                </h3>
                ${documentToHtmlString(item.fields.content, richTextOptions)}
              </article>`;
          }
          return `
            <article>
              <a href="#" class="image">
                ${imageProcessing(item.fields.image)}
              </a>
            </article>`;
          }));
      })
    );
    return `
      <section id="${imageCarousel.fields.sectionLink}" class="wrapper alt style1">
        <div class="inner">
          <h2 class="major">
            ${imageCarousel.fields.sectionTitle}
          </h2>
          <section class="card">
            ${output.join("")}
          </section>
        </div>
      </section>`;
  });

  eleventyConfig.addShortcode("siteIdentity", (siteIdentity) => {
    return `
      <a href="/">
        <img
          class="brand-logo"
          src="https:${siteIdentity.fields.logo.fields.file.url}"
          alt="${siteIdentity.fields.logo.fields.title}"
          loading="lazy"
        >
      </a>
      <h2 class="brand-name">${siteIdentity.fields.brandName}</h2>
    `;
  });

  eleventyConfig.addShortcode("pageLink", (pageLink) => {
    return `
      <a href="/${pageLink.slug}" class="page-link">
        ${pageLink.title}
      </a>
    `;
  });
};
