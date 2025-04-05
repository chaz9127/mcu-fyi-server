let slugify = (text, type, season = "") => {
  let slug = text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace("&", "and")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

  if (type === "series" && season) {
    slug = `${slug}-season-${season}`;
  }

  return slug;
};

let getInfo = () => {
  const name = document.getElementsByTagName("h1")[0].children[0].innerHTML;
  const poster = document.querySelector('div[data-testid="hero-media__poster"]').children[0].children[0].src;
  const dateStr = document.querySelector('li[data-testid="title-details-releasedate"]').getElementsByClassName("ipc-metadata-list-item__list-content-item")[0].innerHTML.split("(")[0].trim();
  const releaseDate = Date.parse(dateStr);
  const description = document.querySelector('[data-testid="plot-xl"]').innerHTML;
  const type = "movie";
  const season = undefined;
  const slug = slugify(name, type, season);
  const duration = "1h 45m";

  const obj = {
    name,
    poster,
    releaseDate,
    duration,
    season,
    description,
    type,
    slug,
    playLink: "",
    trailerLink: "",
    relatedMedia: [""],
    chronologicalOrder: 53,
  };

  setTimeout(() => {
    navigator.clipboard.writeText(JSON.stringify(obj));
    console.log("copied");
  }, 2000);
};

getInfo();
