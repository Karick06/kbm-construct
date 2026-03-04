'use client'

import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { parseCSV } from '@/lib/csv-parser'

interface SMM7Item {
  description: string
  positionLevel: number
  quantity: number
  unit: string
}

interface CESSMItem {
  rawId: string
  parentId: string
  description: string
  unit: string
  quantity: number
  rowIndex: number
}

interface ValescapeItem {
  id: string
  description: string
  unit: string
  quantity: number
  section: string
}

interface LibraryBuildUp {
  components: RateComponent[]
  markup: number
}

type LibraryBuildUps = Record<string, LibraryBuildUp>

type CsvRow = Record<string, string>

const detectDelimiter = (line: string): ',' | '\t' => {
  const commaCount = (line.match(/,/g) || []).length
  const tabCount = (line.match(/\t/g) || []).length
  return tabCount > commaCount ? '\t' : ','
}

const parseDelimitedLine = (line: string, delimiter: ',' | '\t'): string[] => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values.map(value => value.trim())
}

const normalizeHeader = (header: string) => header.toLowerCase().replace(/[\s/_-]+/g, '')

const parseCsvText = (text: string): { headers: string[]; rows: CsvRow[] } => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let headerIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseDelimitedLine(lines[i], detectDelimiter(lines[i]))
    const hasContent = parsed.some(cell => cell.trim().length > 0)
    if (hasContent) {
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    return { headers: [], rows: [] }
  }

  const delimiter = detectDelimiter(lines[headerIndex])
  const headers = parseDelimitedLine(lines[headerIndex], delimiter)
  const rows: CsvRow[] = []

  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseDelimitedLine(lines[i], delimiter)
    const row: CsvRow = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    rows.push(row)
  }

  return { headers, rows }
}


interface TreeNode {
  id: string
  description: string
  level: number
  unit?: string
  quantity?: number
  children: TreeNode[]
  isSection: boolean
  path: string[]
}

interface EstimateItem {
  id: string
  description: string
  fullPath: string
  unit: string
  quantity: number
  rate: number
  amount: number
  section: string
  rateComponents?: RateComponent[]
  constantMarkup?: number
}

interface RateComponent {
  id: string
  description: string
  unit: string
  rate: number
  quantity: number
  output?: number
  constant?: number
}

export default function BOQCreatorPage() {
  const [libraryType, setLibraryType] = useState<'smm7' | 'cessm' | 'valescape'>('smm7')
  const [smm7Tree, setSmm7Tree] = useState<TreeNode[]>([])
  const [cessmTree, setCessmTree] = useState<TreeNode[]>([])
  const [valescapeItems, setValescapeItems] = useState<ValescapeItem[]>([])
  const [valescapeTree, setValescapeTree] = useState<TreeNode[]>([])
  const [valescapeForm, setValescapeForm] = useState({
    description: '',
    unit: '',
    quantity: '1',
    section: 'Valescape'
  })
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [estimates, setEstimates] = useState<EstimateItem[]>([])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showRateBuilder, setShowRateBuilder] = useState(false)
  const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(null)
  const [labourRates, setLabourRates] = useState<RateComponent[]>([])
  const [plantRates, setPlantRates] = useState<RateComponent[]>([])
  const [materialRates, setMaterialRates] = useState<RateComponent[]>([])
  const [activeRateTab, setActiveRateTab] = useState<'labour' | 'plant' | 'material'>('labour')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [importError, setImportError] = useState<string>('')
  const importInputRef = useRef<HTMLInputElement>(null)
  const [libraryBuildUps, setLibraryBuildUps] = useState<LibraryBuildUps>({})
  const [buildUpsNotice, setBuildUpsNotice] = useState<string>('')
  const buildUpsInputRef = useRef<HTMLInputElement>(null)
  
  // Get current tree based on library type
  const tree = libraryType === 'smm7' ? smm7Tree : libraryType === 'cessm' ? cessmTree : valescapeTree

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load SMM7 library
        const smm7Data = await parseCSV<SMM7Item>('smm7-data.csv', (row) => {
          const item: SMM7Item = {
            description: String(row.Description || ''),
            positionLevel: parseInt(String(row['Position/ Level'] || '0')),
            quantity: parseFloat(String(row.Quantity || '1')),
            unit: String(row.Unit || '')
          }
          return item
        })
        
        console.log('Loaded SMM7 items:', smm7Data.length)
        console.log('First 10 items:', smm7Data.slice(0, 10))
        
        if (smm7Data.length === 0) {
          console.error('WARNING: No SMM7 data loaded!')
          setDebugInfo('ERROR: No data loaded from CSV')
          return
        }
        
        const builtTree = buildTree(smm7Data)
        setSmm7Tree(builtTree)
        
        const totalItems = countTreeItems(builtTree)
        setDebugInfo(`✓ Loaded ${smm7Data.length} items → ${builtTree.length} root nodes (${totalItems} total items)`)

        // Load rate libraries
        const labour = await parseCSV<RateComponent>('labour-rates.csv', (row) => ({
          id: crypto.randomUUID(),
          description: String(row.description || row.Description || ''),
          unit: 'hour',
          rate: parseFloat(String(row.hourlyRate || row.Rate || '0')),
          quantity: 1
        }))
        setLabourRates(labour)

        const plant = await parseCSV<RateComponent>('plant-rates.csv', (row) => ({
          id: crypto.randomUUID(),
          description: String(row.description || row.name || row.Description || ''),
          unit: String(row.unit || row.Unit || 'day'),
          rate: parseFloat(String(row.rate || row.Rate || '0')),
          quantity: 1
        }))
        setPlantRates(plant)

        const material = await parseCSV<RateComponent>('material-rates.csv', (row) => ({
          id: crypto.randomUUID(),
          description: String(row.description || row.Description || ''),
          unit: String(row.unit || row.Unit || ''),
          rate: parseFloat(String(row.rate || row.Rate || '0')),
          quantity: 1
        }))
        setMaterialRates(material)
        
        // Try to load CESSM data if available
        try {
          let cessmRowIndex = 0
          const cessmData = await parseCSV<CESSMItem>('cessm-data.csv', (row) => {
            const item: CESSMItem = {
              rawId: String(row['/library/items/item/@id'] || ''),
              parentId: String(row['/library/items/item/@pLevel'] || '0'),
              description: String(row['/library/items/item/@desc'] || ''),
              unit: String(row['/library/items/item/@uom'] || ''),
              quantity: 1,
              rowIndex: cessmRowIndex
            }
            cessmRowIndex += 1
            return item
          })

          if (cessmData.length > 0) {
            const cessmBuiltTree = buildCessmTree(cessmData)
            setCessmTree(cessmBuiltTree)
            console.log('Loaded CESSM items:', cessmData.length)
          }
        } catch (error) {
          console.log('CESSM data not available (optional)')
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setDebugInfo(`Error: ${error}`)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    async function loadBuildUps() {
      try {
        const response = await fetch('/data/boq-buildups.json', { cache: 'no-store' })
        if (!response.ok) return
        const payload = await response.json()
        const buildUps = payload?.buildUps && typeof payload.buildUps === 'object'
          ? payload.buildUps as LibraryBuildUps
          : (payload || {}) as LibraryBuildUps
        setLibraryBuildUps(buildUps)
      } catch {
        // Optional file; ignore if missing.
      }
    }
    loadBuildUps()
  }, [])

  useEffect(() => {
    async function loadValescape() {
      try {
        const response = await fetch('/data/valescape-library.json', { cache: 'no-store' })
        const fileItems = response.ok ? await response.json() : []
        const stored = typeof window !== 'undefined'
          ? window.localStorage.getItem('valescape-library')
          : null
        const storedItems = stored ? JSON.parse(stored) : null
        const items = Array.isArray(storedItems)
          ? storedItems
          : Array.isArray(fileItems)
            ? fileItems
            : []
        setValescapeItems(items as ValescapeItem[])
      } catch {
        // Optional file; ignore if missing.
      }
    }
    loadValescape()
  }, [])

  useEffect(() => {
    setValescapeTree(buildValescapeTree(valescapeItems))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('valescape-library', JSON.stringify(valescapeItems))
    }
  }, [valescapeItems])

  function countTreeItems(nodes: TreeNode[]): number {
    let count = nodes.length
    for (const node of nodes) {
      if (node.children.length > 0) {
        count += countTreeItems(node.children)
      }
    }
    return count
  }

  function buildTree(items: SMM7Item[]): TreeNode[] {
    const root: TreeNode[] = []
    const stack: TreeNode[] = []
    let lastMainSection: TreeNode | null = null
    let lastLevel1Section: TreeNode | null = null
    let lastLevel2Section: TreeNode | null = null
    
    console.log('=== Building Tree ===')
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item || !item.description || !item.description.trim()) continue

      const hasUnit = Boolean(item.unit)
      const isMainSection = /^[A-Z]\d+:/.test(item.description)
      const position = item.positionLevel

      console.log(`[${i}] "${item.description.substring(0, 40)}" | Pos:${position} | Unit:${item.unit || 'none'}`)

      // Main sections (C11:, C20:, etc.) - always root level
      if (isMainSection) {
        const node: TreeNode = {
          id: `node-${i}`,
          description: item.description,
          level: 0,
          children: [],
          isSection: true,
          path: [item.description]
        }
        root.push(node)
        lastMainSection = node
        lastLevel1Section = null
        lastLevel2Section = null
        stack.length = 0
        stack.push(node)
        console.log(`  → ROOT SECTION`)
        continue
      }

      // No main section yet, skip
      if (!lastMainSection) {
        console.log(`  → SKIP (no main section)`)
        continue
      }

      // Measurable items (has unit) - always leaf nodes
      if (hasUnit) {
        const parent = stack[stack.length - 1]
        
        // Check for duplicate in parent's children
        const duplicate = parent.children.find(
          child => child.description === item.description && child.unit === item.unit
        )
        
        if (!duplicate) {
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: stack.length,
            unit: item.unit,
            quantity: item.quantity,
            children: [],
            isSection: false,
            path: [...parent.path, item.description]
          }
          parent.children.push(node)
          console.log(`  → ITEM added to "${parent.description.substring(0, 30)}"`)
        } else {
          console.log(`  → SKIP (duplicate item)`)
        }
        continue
      }

      // Sections (no unit) - need to determine hierarchy
      // Position 1 = new level 1 section (child of main)
      // Position 2+ at level 1 = sibling of level 1
      // Position 1 after level 1 = child of level 1 (level 2)
      // Position 2+ at level 2 = sibling of level 2

      if (position === 1) {
        // Position 1 could be:
        // - New level 1 section (if lastLevel1Section is null)
        // - New level 2 section (if lastLevel1Section exists and lastLevel2Section is null or we just had items)
        
        if (!lastLevel1Section) {
          // First level 1 section under main section
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: 1,
            children: [],
            isSection: true,
            path: [...lastMainSection.path, item.description]
          }
          lastMainSection.children.push(node)
          lastLevel1Section = node
          lastLevel2Section = null
          stack.length = 1
          stack.push(node)
          console.log(`  → LEVEL 1 section (first)`)
        } else if (!lastLevel2Section || stack.length <= 2) {
          // Could be level 2 under current level 1
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: 2,
            children: [],
            isSection: true,
            path: [...lastLevel1Section.path, item.description]
          }
          lastLevel1Section.children.push(node)
          lastLevel2Section = node
          stack.length = 2
          stack.push(node)
          console.log(`  → LEVEL 2 section under "${lastLevel1Section.description.substring(0, 30)}"`)
        } else {
          // Level 3+ (detail description)
          const parent = stack[stack.length - 1]
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: stack.length,
            children: [],
            isSection: true,
            path: [...parent.path, item.description]
          }
          parent.children.push(node)
          stack.push(node)
          console.log(`  → LEVEL 3+ section under "${parent.description.substring(0, 30)}"`)
        }
      } else if (position === 2) {
        // Position 2 = sibling at current level
        if (stack.length === 1) {
          // Level 1 sibling
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: 1,
            children: [],
            isSection: true,
            path: [...lastMainSection.path, item.description]
          }
          lastMainSection.children.push(node)
          lastLevel1Section = node
          lastLevel2Section = null
          stack.length = 1
          stack.push(node)
          console.log(`  → LEVEL 1 section (sibling)`)
        } else {
          // Higher level sibling - pop stack to match level
          const parent = stack[stack.length - 2]
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: stack.length - 1,
            children: [],
            isSection: true,
            path: [...parent.path, item.description]
          }
          parent.children.push(node)
          stack[stack.length - 1] = node
          console.log(`  → SIBLING of current level`)
        }
      } else {
        // Position 3+ = continue at current level or deeper
        const parent = stack[stack.length - 1]
        const node: TreeNode = {
          id: `node-${i}`,
          description: item.description,
          level: stack.length,
          children: [],
          isSection: true,
          path: [...parent.path, item.description]
        }
        parent.children.push(node)
        console.log(`  → Continue at level ${stack.length}`)
      }
    }

    console.log('=== Tree Build Complete ===')
    console.log('Root nodes:', root.length)
    root.forEach(node => {
      console.log(`- ${node.description}: ${node.children.length} children`)
    })

    return root
  }

  function buildCessmTree(items: CESSMItem[]): TreeNode[] {
    const nodesByKey = new Map<string, TreeNode>()
    const nodesByRawId = new Map<string, TreeNode>()

    for (const item of items) {
      if (!item.description || !item.description.trim()) continue
      if (!item.rawId) continue

      const hasUnit = Boolean(item.unit)
      const uniqueId = `cessm-${item.rawId}-${item.rowIndex}`
      const node: TreeNode = {
        id: uniqueId,
        description: item.description,
        level: 0,
        unit: item.unit || undefined,
        quantity: item.quantity,
        children: [],
        isSection: !hasUnit,
        path: [item.description]
      }
      if (!nodesByRawId.has(item.rawId)) {
        nodesByRawId.set(item.rawId, node)
      }
      nodesByKey.set(uniqueId, node)
    }

    const linkedRoots: TreeNode[] = []
    for (const item of items) {
      const uniqueId = `cessm-${item.rawId}-${item.rowIndex}`
      const node = nodesByKey.get(uniqueId)
      if (!node) continue

      const parentId = item.parentId && item.parentId !== '0' ? item.parentId : ''
      const parent = parentId ? nodesByRawId.get(parentId) : undefined

      if (parent) {
        parent.children.push(node)
        parent.isSection = true
      } else {
        linkedRoots.push(node)
      }
    }

    const assignLevels = (node: TreeNode, level: number, path: string[]) => {
      node.level = level
      node.path = path
      for (const child of node.children) {
        assignLevels(child, level + 1, [...path, child.description])
      }
    }

    for (const root of linkedRoots) {
      assignLevels(root, 0, [root.description])
    }

    return linkedRoots
  }

  function buildValescapeTree(items: ValescapeItem[]): TreeNode[] {
    const sections = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    for (const item of items) {
      const sectionName = item.section?.trim() || 'Valescape'
      let sectionNode = sections.get(sectionName)

      if (!sectionNode) {
        sectionNode = {
          id: `valescape-section-${sectionName}`,
          description: sectionName,
          level: 0,
          children: [],
          isSection: true,
          path: [sectionName]
        }
        sections.set(sectionName, sectionNode)
        roots.push(sectionNode)
      }

      sectionNode.children.push({
        id: item.id,
        description: item.description,
        level: 1,
        unit: item.unit || undefined,
        quantity: item.quantity,
        children: [],
        isSection: false,
        path: [sectionName, item.description]
      })
    }

    return roots
  }

  function toggleNode(nodeId: string) {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  function filterTree(nodes: TreeNode[], term: string): TreeNode[] {
    if (!term) return nodes

    const results: TreeNode[] = []
    
    for (const node of nodes) {
      const nodeMatches = node.description.toLowerCase().includes(term.toLowerCase())
      const filteredChildren = filterTree(node.children, term)
      const hasMatchingChildren = filteredChildren.length > 0
      
      if (nodeMatches || hasMatchingChildren) {
        results.push({
          ...node,
          children: filteredChildren
        })
      }
    }
    
    return results
  }

  function addToEstimate(node: TreeNode) {
    if (!node.unit) return

    const fullPath = node.path.join(' > ')
    const section = node.path[0] || 'General'
    const buildUpKey = getBuildUpKey(fullPath, node.description)
    const savedBuildUp = libraryBuildUps[buildUpKey]
    const savedRate = savedBuildUp ? calculateBuildUpRate(savedBuildUp.components, savedBuildUp.markup) : 0

    const newItem: EstimateItem = {
      id: crypto.randomUUID(),
      description: node.description,
      fullPath,
      unit: node.unit,
      quantity: node.quantity || 1,
      rate: savedRate,
      amount: savedRate * (node.quantity || 1),
      section
    }

    if (savedBuildUp) {
      newItem.rateComponents = savedBuildUp.components
      newItem.constantMarkup = savedBuildUp.markup
    }

    console.log('Adding to estimate:', {
      description: node.description,
      path: node.path,
      fullPath,
      unit: node.unit
    })

    setEstimates(prev => [...prev, newItem])
  }

  function openRateBuilder(estimateId: string) {
    setCurrentEstimateId(estimateId)
    setShowRateBuilder(true)
  }

  function applyRate(components: RateComponent[], markup: number) {
    if (!currentEstimateId) return

    const totalRate = calculateBuildUpRate(components, markup)

    setEstimates(prev =>
      prev.map(item =>
        item.id === currentEstimateId
          ? { ...item, rate: totalRate, amount: totalRate * item.quantity, rateComponents: components, constantMarkup: markup }
          : item
      )
    )

    setShowRateBuilder(false)
    setCurrentEstimateId(null)
  }

  function saveBuildUpToLibrary(components: RateComponent[], markup: number) {
    const currentEstimate = estimates.find(item => item.id === currentEstimateId)
    if (!currentEstimate) return
    const key = getBuildUpKey(currentEstimate.fullPath, currentEstimate.description)
    setLibraryBuildUps(prev => ({
      ...prev,
      [key]: { components, markup }
    }))
    setBuildUpsNotice('Build-up saved to library.')
  }

  function updateQuantity(id: string, newQuantity: number) {
    setEstimates(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, amount: item.rate * newQuantity }
          : item
      )
    )
  }

  function removeEstimateItem(id: string) {
    setEstimates(prev => prev.filter(item => item.id !== id))
  }

  function addManualEstimateLine(section: string) {
    const description = window.prompt('Line description?')?.trim()
    if (!description) return
    const unit = window.prompt('Unit (optional)?')?.trim() || ''
    const quantityInput = window.prompt('Quantity?', '1')?.trim() || '1'
    const quantityValue = parseFloat(quantityInput)
    const quantity = Number.isFinite(quantityValue) ? quantityValue : 1

    const newItem: EstimateItem = {
      id: crypto.randomUUID(),
      description,
      fullPath: `${section} > ${description}`,
      unit,
      quantity,
      rate: 0,
      amount: 0,
      section
    }

    setEstimates(prev => [...prev, newItem])
  }

  function addEstimateToValescape(item: EstimateItem) {
    const newItem: ValescapeItem = {
      id: `valescape-${crypto.randomUUID()}`,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      section: item.section || 'Valescape'
    }
    setValescapeItems(prev => [newItem, ...prev])
    setBuildUpsNotice('Added item to VALESCAPE.')
  }

  function toggleSection(section: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const filteredTree = filterTree(tree, searchTerm)

  const mapRowToEstimate = (row: CsvRow, headerMap: Map<string, string>): EstimateItem | null => {
    const getValue = (keys: string[]) => {
      for (const key of keys) {
        const header = headerMap.get(key)
        if (header && row[header]) return row[header]
      }
      return ''
    }

    const description = getValue(['description', 'desc', 'item', 'itemdescription']).trim()
    if (!description) return null

    const unit = getValue(['unit', 'uom']).trim()
    const section = getValue(['section', 'group', 'category']).trim() || 'General'
    const fullPath = getValue(['fullpath', 'path']).trim() || description
    const quantityValue = parseFloat(getValue(['quantity', 'qty']))
    const rateValue = parseFloat(getValue(['rate', 'unitrate']))
    const amountValue = parseFloat(getValue(['amount', 'total', 'lineamount']))

    const quantity = Number.isFinite(quantityValue) ? quantityValue : 1
    const rate = Number.isFinite(rateValue) ? rateValue : 0
    const amount = Number.isFinite(amountValue) ? amountValue : rate * quantity

    return {
      id: crypto.randomUUID(),
      description,
      fullPath,
      unit,
      quantity,
      rate,
      amount,
      section
    }
  }

  const handleImportClick = () => {
    if (importInputRef.current) {
      importInputRef.current.value = ''
      importInputRef.current.click()
    }
  }

  const calculateBuildUpRate = (components: RateComponent[], markup: number) => {
    const subtotal = components.reduce((sum, comp) => sum + (comp.rate * comp.quantity / (comp.output || 1)), 0)
    const constantsTotal = components.reduce((sum, comp) => sum + (comp.constant || 0), 0)
    return subtotal + constantsTotal + (subtotal * markup / 100)
  }

  const getBuildUpKey = (fullPath: string, description: string) => {
    return fullPath.trim().length > 0 ? fullPath : description
  }

  const handleBuildUpsImportClick = () => {
    if (buildUpsInputRef.current) {
      buildUpsInputRef.current.value = ''
      buildUpsInputRef.current.click()
    }
  }

  const handleBuildUpsImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      const buildUps = payload?.buildUps && typeof payload.buildUps === 'object'
        ? payload.buildUps as LibraryBuildUps
        : (payload || {}) as LibraryBuildUps
      setLibraryBuildUps(buildUps)
      setBuildUpsNotice('Build-ups imported.')
    } catch {
      setBuildUpsNotice('Build-ups import failed. Check JSON format.')
    }
  }

  const handleBuildUpsExport = () => {
    const payload = JSON.stringify({ version: 1, buildUps: libraryBuildUps }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'boq-buildups.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleValescapeAdd = () => {
    const description = valescapeForm.description.trim()
    if (!description) return

    const quantityValue = parseFloat(valescapeForm.quantity)
    const quantity = Number.isFinite(quantityValue) ? quantityValue : 1

    const newItem: ValescapeItem = {
      id: `valescape-${crypto.randomUUID()}`,
      description,
      unit: valescapeForm.unit.trim(),
      quantity,
      section: valescapeForm.section.trim() || 'Valescape'
    }

    setValescapeItems(prev => [newItem, ...prev])
    setValescapeForm(prev => ({
      ...prev,
      description: '',
      unit: '',
      quantity: '1'
    }))
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { headers, rows } = parseCsvText(await file.text())

      if (headers.length === 0 || rows.length === 0) {
        setImportError('Import failed: no data rows found in file.')
        return
      }

      const headerMap = new Map<string, string>()
      headers.forEach(header => {
        headerMap.set(normalizeHeader(header), header)
      })

      const imported = rows
        .map(row => mapRowToEstimate(row, headerMap))
        .filter((item): item is EstimateItem => item !== null)

      if (imported.length === 0) {
        setImportError('Import failed: could not map any rows to BoQ items.')
        return
      }

      setImportError('')

      if (estimates.length > 0) {
        const shouldReplace = window.confirm(
          'Replace current estimate with imported BoQ? Click Cancel to append.'
        )
        if (shouldReplace) {
          setEstimates(imported)
          setCollapsedSections(new Set())
        } else {
          setEstimates(prev => [...prev, ...imported])
        }
      } else {
        setEstimates(imported)
      }
    } catch (error) {
      setImportError('Import failed: unable to read file.')
    }
  }

  // Group estimates by section
  const groupedEstimates = estimates.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, EstimateItem[]>)

  const grandTotal = estimates.reduce((sum, item) => sum + item.amount, 0)

  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--line)] p-5 shadow-[var(--shadow)] flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Bill of Quantities Creator</h1>
        <button
          onClick={() => router.push('/drawing-measurement')}
          className="rounded-lg border border-orange-500 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/20"
        >
          📐 Measurement Tool
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Library */}
        <div className="w-1/3 border-r border-[var(--line)] bg-[var(--surface)] flex flex-col">
          {/* Library Type Tabs */}
          <div className="flex border-b border-[var(--line)]">
            <button
              onClick={() => setLibraryType('smm7')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                libraryType === 'smm7'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              SMM7
            </button>
            <button
              onClick={() => setLibraryType('cessm')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                libraryType === 'cessm'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              CESSM
            </button>
            <button
              onClick={() => setLibraryType('valescape')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                libraryType === 'valescape'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              VALESCAPE
            </button>
          </div>

          {/* Build-up Library Controls */}
          <div className="p-3 border-b border-[var(--line)] flex items-center gap-2">
            <button
              onClick={handleBuildUpsImportClick}
              className="px-2 py-1 text-xs bg-[var(--surface-2)] text-[var(--muted)] rounded hover:text-[var(--ink)]"
            >
              Import Build-ups
            </button>
            <button
              onClick={handleBuildUpsExport}
              className="px-2 py-1 text-xs bg-[var(--surface-2)] text-[var(--muted)] rounded hover:text-[var(--ink)]"
            >
              Export Build-ups
            </button>
            <input
              ref={buildUpsInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleBuildUpsImportFile}
              className="hidden"
            />
          </div>

          {libraryType === 'valescape' && (
            <div className="p-4 border-b border-[var(--line)] space-y-2">
              <input
                type="text"
                placeholder="Item description"
                value={valescapeForm.description}
                onChange={(e) => setValescapeForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-md bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--muted)]"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Unit"
                  value={valescapeForm.unit}
                  onChange={(e) => setValescapeForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="px-3 py-2 border border-[var(--line)] rounded-md bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--muted)]"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={valescapeForm.quantity}
                  onChange={(e) => setValescapeForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="px-3 py-2 border border-[var(--line)] rounded-md bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--muted)]"
                />
                <input
                  type="text"
                  placeholder="Section"
                  value={valescapeForm.section}
                  onChange={(e) => setValescapeForm(prev => ({ ...prev, section: e.target.value }))}
                  className="px-3 py-2 border border-[var(--line)] rounded-md bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--muted)]"
                />
              </div>
              <button
                onClick={handleValescapeAdd}
                className="w-full px-3 py-2 text-xs font-semibold bg-[var(--accent)] text-black rounded hover:opacity-90"
              >
                Add to Valescape
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="p-4 border-b border-[var(--line)]">
            <input
              type="text"
              placeholder="Search library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-md bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {buildUpsNotice && (
              <p className="text-xs text-[var(--muted)] mt-2">{buildUpsNotice}</p>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {tree.length === 0 ? (
              <div className="text-[var(--muted)] text-sm">
                <p>
                  {libraryType === 'valescape'
                    ? 'No Valescape items yet. Add items above.'
                    : `No data available for ${libraryType.toUpperCase()}`}
                </p>
              </div>
            ) : (
              <TreeView nodes={filteredTree} expandedNodes={expandedNodes} onToggle={toggleNode} onAdd={addToEstimate} />
            )}
          </div>
        </div>

        {/* Right Panel - Estimate */}
        <div className="flex-1 bg-[var(--surface)] flex flex-col">
          <div className="p-4 border-b border-[var(--line)] bg-[var(--surface)]">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--ink)]">Estimate</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportClick}
                  className="px-3 py-2 text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted)] rounded hover:text-[var(--ink)]"
                >
                  Import BoQ
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv,.tsv,text/csv,text/tab-separated-values"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <div className="text-right">
                  <div className="text-sm text-[var(--muted)]">Grand Total</div>
                  <div className="text-2xl font-bold text-[var(--accent)]">£{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
            {importError && (
              <p className="text-xs text-red-400 mt-2">{importError}</p>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {Object.entries(groupedEstimates).map(([section, items]) => (
              <EstimateSection
                key={section}
                section={section}
                items={items}
                isCollapsed={collapsedSections.has(section)}
                onToggle={() => toggleSection(section)}
                onAddLine={() => addManualEstimateLine(section)}
                onAddToValescape={addEstimateToValescape}
                onUpdateQuantity={updateQuantity}
                onRemove={removeEstimateItem}
                onOpenRateBuilder={openRateBuilder}
              />
            ))}
            {estimates.length === 0 && (
              <div className="flex items-center justify-center h-full text-[var(--muted)]">
                <div className="text-center">
                  <p className="text-lg">No items in estimate</p>
                  <p className="text-sm">Drag items from the library to add them</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate Builder Modal */}
      {showRateBuilder && (
        <RateBuilderModal
          labourRates={labourRates}
          plantRates={plantRates}
          materialRates={materialRates}
          activeTab={activeRateTab}
          onTabChange={setActiveRateTab}
          onApply={applyRate}
          onSaveToLibrary={saveBuildUpToLibrary}
          onClose={() => {
            setShowRateBuilder(false)
            setCurrentEstimateId(null)
          }}
          initialComponents={estimates.find(e => e.id === currentEstimateId)?.rateComponents || []}
          initialMarkup={estimates.find(e => e.id === currentEstimateId)?.constantMarkup || 0}
        />
      )}
    </div>
  )
}

// Tree View Component
function TreeView({
  nodes,
  expandedNodes,
  onToggle,
  onAdd
}: {
  nodes: TreeNode[]
  expandedNodes: Set<string>
  onToggle: (id: string) => void
  onAdd: (node: TreeNode) => void
}) {
  console.log('TreeView render with', nodes.length, 'nodes');
  
  if (nodes.length === 0) {
    return (
      <div className="text-[var(--muted)] text-sm p-4">
        <p>No items in library</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <TreeNode key={node.id} node={node} expandedNodes={expandedNodes} onToggle={onToggle} onAdd={onAdd} />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  expandedNodes,
  onToggle,
  onAdd,
  level = 0
}: {
  node: TreeNode
  expandedNodes: Set<string>
  onToggle: (id: string) => void
  onAdd: (node: TreeNode) => void
  level?: number
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const canAdd = Boolean(node.unit)

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-[var(--surface-2)] rounded cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        draggable={canAdd}
        onDragStart={(e) => {
          if (canAdd) {
            e.dataTransfer.effectAllowed = 'copy'
            e.dataTransfer.setData('application/json', JSON.stringify(node))
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          const data = e.dataTransfer.getData('application/json')
          if (data) {
            const droppedNode = JSON.parse(data) as TreeNode
            onAdd(droppedNode)
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {hasChildren && (
          <button
            onClick={() => onToggle(node.id)}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-[var(--surface-2)] rounded"
          >
            <span className="text-xs text-[var(--muted)]">{isExpanded ? '−' : '+'}</span>
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        
        <span className={`flex-1 text-sm text-[var(--ink)] ${node.isSection ? 'font-semibold' : ''}`}>
          {node.description}
        </span>
        
        {node.unit && (
          <span className="text-xs text-[var(--muted)] mr-2">{node.unit}</span>
        )}
        
        {canAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd(node)
            }}
            className="flex-shrink-0 px-2 py-1 text-xs bg-[var(--accent)] text-black rounded hover:opacity-90"
          >
            Add
          </button>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onAdd={onAdd}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Estimate Section Component
function EstimateSection({
  section,
  items,
  isCollapsed,
  onToggle,
  onAddLine,
  onAddToValescape,
  onUpdateQuantity,
  onRemove,
  onOpenRateBuilder
}: {
  section: string
  items: EstimateItem[]
  isCollapsed: boolean
  onToggle: () => void
  onAddLine: () => void
  onAddToValescape: (item: EstimateItem) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onOpenRateBuilder: (id: string) => void
}) {
  const sectionTotal = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="border-b border-[var(--line)]">
      <div
        className="bg-[var(--surface-2)] px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-[var(--surface)]"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">{isCollapsed ? '▶' : '▼'}</span>
          <span className="font-semibold text-[var(--ink)]">{section}</span>
          <span className="text-sm text-[var(--muted)]">({items.length} items)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(event) => {
              event.stopPropagation()
              onAddLine()
            }}
            className="px-2 py-1 text-xs bg-[var(--surface)] text-[var(--muted)] rounded hover:text-[var(--ink)]"
          >
            Add line
          </button>
          <span className="font-semibold text-[var(--ink)]">£{sectionTotal.toFixed(2)}</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-[var(--line)]">
          {items.map(item => (
            <EstimateRow
              key={item.id}
              item={item}
              onAddToValescape={() => onAddToValescape(item)}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
              onOpenRateBuilder={onOpenRateBuilder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Estimate Row Component
function EstimateRow({
  item,
  onAddToValescape,
  onUpdateQuantity,
  onRemove,
  onOpenRateBuilder
}: {
  item: EstimateItem
  onAddToValescape: () => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onOpenRateBuilder: (id: string) => void
}) {
  const [isEditingQty, setIsEditingQty] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingQty && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingQty])

  return (
    <div className="px-4 py-3 hover:bg-[var(--surface-2)] grid grid-cols-12 gap-2 items-center text-sm">
      <div className="col-span-4">
        <div className="font-medium text-[var(--ink)]">{item.description}</div>
        <div className="text-xs text-[var(--muted)] mt-1">{item.fullPath}</div>
      </div>
      
      <div className="col-span-1 text-center">
        {isEditingQty ? (
          <input
            ref={inputRef}
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
            onBlur={() => setIsEditingQty(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingQty(false)
            }}
            className="w-full px-2 py-1 border border-[var(--accent)] rounded text-center text-[var(--ink)] bg-[var(--surface-2)]"
          />
        ) : (
          <span
            onClick={() => setIsEditingQty(true)}
            className="cursor-pointer hover:bg-[var(--surface-2)] px-2 py-1 rounded text-[var(--ink)]"
          >
            {item.quantity}
          </span>
        )}
      </div>
      
      <div className="col-span-1 text-center text-[var(--muted)]">
        {item.unit}
      </div>
      
      <div className="col-span-2 text-right">
        <button
          onClick={() => onOpenRateBuilder(item.id)}
          className="text-[var(--accent)] hover:opacity-80 hover:underline"
        >
          £{item.rate.toFixed(2)}
        </button>
      </div>
      
      <div className="col-span-2 text-right font-medium text-[var(--ink)]">
        £{item.amount.toFixed(2)}
      </div>
      
      <div className="col-span-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onAddToValescape}
            className="px-2 py-0.5 text-[10px] bg-[var(--surface-2)] text-[var(--muted)] rounded hover:text-[var(--ink)]"
          >
            Add
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// Rate Builder Modal Component
function RateBuilderModal({
  labourRates,
  plantRates,
  materialRates,
  activeTab,
  onTabChange,
  onApply,
  onSaveToLibrary,
  onClose,
  initialComponents = [],
  initialMarkup = 0
}: {
  labourRates: RateComponent[]
  plantRates: RateComponent[]
  materialRates: RateComponent[]
  activeTab: 'labour' | 'plant' | 'material'
  onTabChange: (tab: 'labour' | 'plant' | 'material') => void
  onApply: (components: RateComponent[], markup: number) => void
  onSaveToLibrary?: (components: RateComponent[], markup: number) => void
  onClose: () => void
  initialComponents?: RateComponent[]
  initialMarkup?: number
}) {
  const [selectedComponents, setSelectedComponents] = useState<RateComponent[]>(initialComponents)
  const [searchTerm, setSearchTerm] = useState('')
  const [constantMarkup, setConstantMarkup] = useState<number>(initialMarkup)

  const currentRates = activeTab === 'labour' ? labourRates : activeTab === 'plant' ? plantRates : materialRates

  const filteredRates = currentRates.filter(rate =>
    rate.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function addComponent(rate: RateComponent) {
    setSelectedComponents(prev => [...prev, { ...rate, id: crypto.randomUUID(), quantity: 1, output: 1, constant: 0 }])
  }

  function removeComponent(id: string) {
    setSelectedComponents(prev => prev.filter(c => c.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    setSelectedComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, quantity } : c))
    )
  }

  function updateOutput(id: string, output: number) {
    setSelectedComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, output } : c))
    )
  }

  function updateConstant(id: string, constant: number) {
    setSelectedComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, constant } : c))
    )
  }

  const subtotal = selectedComponents.reduce((sum, comp) => sum + (comp.rate * comp.quantity / (comp.output || 1)), 0)
  const constantsTotal = selectedComponents.reduce((sum, comp) => sum + (comp.constant || 0), 0)
  const totalRate = subtotal + constantsTotal + (subtotal * constantMarkup / 100)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow)] w-3/4 h-3/4 flex flex-col border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)]">
          <h2 className="text-xl font-semibold text-[var(--ink)]">Rate Builder</h2>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left - Rate Library */}
          <div className="w-1/2 border-r border-[var(--line)] flex flex-col">
            <div className="border-b border-[var(--line)]">
              <div className="flex">
                <button
                  onClick={() => onTabChange('labour')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'labour'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Labour
                </button>
                <button
                  onClick={() => onTabChange('plant')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'plant'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Plant
                </button>
                <button
                  onClick={() => onTabChange('material')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'material'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Material
                </button>
              </div>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search rates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-md text-sm bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--muted)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)] sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-[var(--ink)]">Description</th>
                    <th className="px-4 py-2 text-left text-[var(--ink)]">Unit</th>
                    <th className="px-4 py-2 text-right text-[var(--ink)]">Rate</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredRates.map(rate => (
                    <tr key={rate.id} className="hover:bg-[var(--surface-2)]">
                      <td className="px-4 py-2 text-[var(--muted)]">{rate.description}</td>
                      <td className="px-4 py-2 text-[var(--muted)]">{rate.unit}</td>
                      <td className="px-4 py-2 text-right text-[var(--muted)]">£{rate.rate.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => addComponent(rate)}
                          className="px-2 py-1 text-xs bg-[var(--accent)] text-black rounded hover:opacity-90"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right - Selected Components */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-[var(--line)] bg-[var(--surface)]">
              <h3 className="font-semibold text-[var(--ink)]">Selected Components</h3>
            </div>

            <div className="flex-1 overflow-auto">
              {selectedComponents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--muted)]">
                  <p>No components selected</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-2)] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[var(--ink)]">Description</th>
                      <th className="px-3 py-2 text-center text-[var(--ink)]">Qty</th>
                      <th className="px-3 py-2 text-center text-[var(--ink)]">Output</th>
                      <th className="px-3 py-2 text-right text-[var(--ink)]">Rate</th>
                      <th className="px-3 py-2 text-right text-[var(--ink)]">Constant</th>
                      <th className="px-3 py-2 text-right text-[var(--ink)]">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {selectedComponents.map(comp => {
                      const componentTotal = (comp.rate * comp.quantity / (comp.output || 1)) + (comp.constant || 0)
                      return (
                        <tr key={comp.id} className="hover:bg-[var(--surface-2)]">
                          <td className="px-3 py-2 text-xs text-[var(--muted)]">{comp.description}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={comp.quantity}
                              onChange={(e) => updateQuantity(comp.id, parseFloat(e.target.value) || 0)}
                              className="w-12 px-2 py-1 border border-[var(--line)] rounded text-center text-xs bg-[var(--surface-2)] text-[var(--ink)]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={comp.output || 1}
                              onChange={(e) => updateOutput(comp.id, parseFloat(e.target.value) || 1)}
                              className="w-12 px-2 py-1 border border-[var(--line)] rounded text-center text-xs bg-[var(--surface-2)] text-[var(--ink)]"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-[var(--muted)]">£{comp.rate.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={comp.constant || 0}
                              onChange={(e) => updateConstant(comp.id, parseFloat(e.target.value) || 0)}
                              className="w-14 px-2 py-1 border border-[var(--line)] rounded text-center text-xs bg-[var(--surface-2)] text-[var(--ink)]"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-medium text-[var(--ink)]">£{componentTotal.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeComponent(comp.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted)]">Subtotal (Rate × Qty ÷ Output):</span>
                  <span className="font-medium text-[var(--ink)]">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted)]">Constants Total:</span>
                  <span className="font-medium text-[var(--ink)]">£{constantsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-[var(--muted)]">Markup %:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={constantMarkup}
                    onChange={(e) => setConstantMarkup(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-[var(--line)] rounded text-right text-sm bg-[var(--surface-2)] text-[var(--ink)]"
                  />
                  <span className="text-xs text-[var(--muted)]">=£{(subtotal * constantMarkup / 100).toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-[var(--line)] pt-2">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-[var(--ink)]">Total Rate:</span>
                  <span className="text-2xl font-bold text-[var(--accent)]">£{totalRate.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-[var(--surface-2)] text-[var(--muted)] rounded hover:text-[var(--ink)]"
                  >
                    Cancel
                  </button>
                  {onSaveToLibrary && (
                    <button
                      onClick={() => onSaveToLibrary(selectedComponents, constantMarkup)}
                      disabled={selectedComponents.length === 0}
                      className="flex-1 px-4 py-2 bg-[var(--surface-2)] text-[var(--muted)] rounded hover:text-[var(--ink)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Save to Library
                    </button>
                  )}
                  <button
                    onClick={() => onApply(selectedComponents, constantMarkup)}
                    disabled={selectedComponents.length === 0}
                    className="flex-1 px-4 py-2 bg-[var(--accent)] text-black rounded hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Apply Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
