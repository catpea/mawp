export default function transcend(element, selector, ) {
    // Check if the element exists and is not the document or window
    if (element && element !== document && element !== window) {
        // Try to find the closest element matching the selector
        const closestElement = element.closest(selector);
        if (closestElement) {
            return closestElement;
        }
    }
    // If not found, traverse into the shadow DOM host and search there
    return transcend(element.getRootNode().host, selector);
}
