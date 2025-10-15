-- Simple Mermaid filter for Pandoc
-- Converts mermaid code blocks to images using mmdc

local system = require 'pandoc.system'

function CodeBlock(block)
  if block.classes[1] == "mermaid" then
    local mermaid_code = block.text
    local basename = pandoc.sha1(mermaid_code)
    local input_file = basename .. ".mmd"
    local output_file = basename .. ".png"
    
    -- Write mermaid code to temp file
    local f = io.open(input_file, "w")
    f:write(mermaid_code)
    f:close()
    
    -- Convert using mmdc
    local cmd = string.format('mmdc -i "%s" -o "%s" -b transparent', input_file, output_file)
    os.execute(cmd)
    
    -- Clean up input file
    os.remove(input_file)
    
    -- Return image if it was created
    if pandoc.system.get_working_directory() then
      return pandoc.Para({pandoc.Image({}, output_file)})
    end
  end
  
  return block
end
