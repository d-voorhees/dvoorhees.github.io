// Run the function when the page loads
function capitalizeAIML() {
    const regex = /\bai\/ml\b/gi;

    function replaceText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const newFragment = document.createDocumentFragment();
            const parts = node.textContent.split(regex);

            for (let i = 0; i < parts.length; i++) {
                newFragment.appendChild(document.createTextNode(parts[i]));
                if (i < parts.length - 1) {
                    const span = document.createElement('span');
                    span.innerHTML = 'AI/ML'.split('').map(char => `<span style="text-transform: uppercase !important; display: inline-block;">${char}</span>`).join('');
                    newFragment.appendChild(span);
                }
            }

            node.parentNode.replaceChild(newFragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE'].includes(node.nodeName)) {
            for (let child of node.childNodes) {
                replaceText(child);
            }
        }
    }

    replaceText(document.body);
}

// Run the function when the page loads
document.addEventListener('DOMContentLoaded', capitalizeAIML);

// Re-run the function periodically to catch any dynamically added content
setInterval(capitalizeAIML, 5000); // Check every 5 seconds