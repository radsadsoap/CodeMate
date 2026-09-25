export const ROLES = Object.freeze({
    STUDENT: 'student',
    TA: 'teaching_assistant',
});

export const LANGUAGES = Object.freeze(['javascript', 'python', 'java', 'cpp']);

export const STARTER_CODE = Object.freeze({
    javascript: `const topics = ['closures', 'promises', 'recursion'];

for (const topic of topics) {
    console.log(\`Today we practice \${topic}.\`);
}
`,
    python: `topics = ["loops", "dictionaries", "recursion"]

for topic in topics:
    print(f"Today we practice {topic}.")
`,
    java: `public class Main {
    public static void main(String[] args) {
        String[] topics = {"arrays", "classes", "recursion"};
        for (String topic : topics) {
            System.out.println("Today we practice " + topic + ".");
        }
    }
}
`,
    cpp: `#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> topics = {"pointers", "vectors", "recursion"};
    for (const auto& topic : topics) {
        std::cout << "Today we practice " << topic << "." << std::endl;
    }
    return 0;
}
`,
});

export const LIMITS = Object.freeze({
    codeChars: 100_000,
    stdinChars: 16_000,
    updateBytes: 256 * 1024,
});
