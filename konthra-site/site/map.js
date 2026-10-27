
const locations = {
  everny: {
    type: "Town",
    name: "Everny",
    description: "The effective capital of the North. Home to Yanrish and the Violet Shadows.",
    npcs: []
  },

  millbrook: {
    type: "Village",
    name: "Millbrook",
    description: "A town left in chaos. Maeve, the existing mayor, was overthrown in a riot, with no clear successor.",
    npcs: []
  },

  "saltpetre-docks": {
    type: "Docks",
    name: "Saltpetre Docks",
    description: "The original sighting of Maelstrom, and the source of some of its more brutal attacks.",
    npcs: []
  },

  unterveil: {
    type: "Village",
    name: "Unterveil",
    description: "Home to Maliphant, surrounded by a ring of charged Leechstone, preventing most magical forms of messaging or teleportation.",
    npcs: []
  }
};

const panel = document.querySelector("#location-panel");
const nameField = document.querySelector("#location-name");
const typeField = document.querySelector("#location-type");
const regionField = document.querySelector("#location-region");
const descriptionField = document.querySelector("#location-description");
const notableSection = document.querySelector("#notable-section");
const npcsField = document.querySelector("#location-npcs");
const closeButton = document.querySelector("#location-close");
const markers = document.querySelectorAll(".map-marker");

function closeLocation() {
  panel.hidden = true;

  markers.forEach(marker =>
    marker.setAttribute("aria-expanded", "false")
  );
}

function openLocation(marker) {
  const location = locations[marker.dataset.location];
  if (!location) return;

  typeField.textContent = location.type;
  regionField.textContent = location.region || "";
  nameField.textContent = location.name;
  descriptionField.textContent = location.description;

  npcsField.replaceChildren();

  (location.npcs || []).forEach(npc => {
    const tag = document.createElement("a");
    tag.className = "npc-tag";
    tag.textContent = npc.name;

    if (npc.id) {
      tag.href = `#${encodeURIComponent(npc.id)}`;
    } else {
      tag.removeAttribute("href");
    }

    npcsField.appendChild(tag);
  });

  notableSection.hidden = !location.npcs?.length;
  panel.hidden = false;

  markers.forEach(item =>
    item.setAttribute(
      "aria-expanded",
      String(item === marker)
    )
  );
}

markers.forEach(marker => {
  marker.setAttribute("aria-expanded", "false");

  marker.addEventListener("click", () => {
    openLocation(marker);
  });

  marker.addEventListener("mouseenter", () => {
    const location = locations[marker.dataset.location];
    if (location) {
      marker.title = location.name;
    }
  });
});

closeButton.addEventListener("click", closeLocation);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeLocation();
});
