export function createShelterMarkerIcon(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1f8b43] bg-white shadow-md";

  const img = document.createElement("img");
  img.src = "/icons/evacuation-site.svg";
  img.alt = "";
  img.draggable = false;
  img.className = "h-8 w-8";

  wrapper.appendChild(img);
  return wrapper;
}
