// ******* LScript  **************************

/**
* LScript allows to compile code during execution time having a clean context
* @class LScript
* @constructor
*/

function LScript()
{
	this.code = "function update(dt) {\n\n}";
	this.valid_callbacks = ["start","update"];
	this.extracode = "";
	this.catch_exceptions = true;
}

LScript.onerror = null; //global used to catch errors in scripts

LScript.show_errors_in_console = true;

LScript.prototype.compile = function( arg_vars )
{
	var argv_names = [];
	var argv_values = [];
	if(arg_vars)
	{
		for(var i in arg_vars)
		{
			argv_names.push(i);
			argv_values.push( arg_vars[i]);
		}
	}
	argv_names = argv_names.join(",");

	var code = this.code;
	code = LScript.expandCode( code );

	var extra_code = "";
	for(var i in this.valid_callbacks)
	{
		var callback_name = this.valid_callbacks[i];
		extra_code += "	if(typeof("+callback_name+") != 'undefined' && "+callback_name+" != window[\""+callback_name+"\"] ) this."+callback_name + " = "+callback_name+";\n";
	}
	code += extra_code;
	this._last_executed_code = code;
	
	try
	{
		this._class = new Function(argv_names, code);
		this._context = LScript.applyToConstructor( this._class, argv_values );
	}
	catch (err)
	{
		this._class = null;
		this._context = null;
		if(LScript.show_errors_in_console)
		{
			console.error("Error in script\n" + err);
			console.error(this._last_executed_code );
		}
		if(this.onerror)
			this.onerror(err, this._last_executed_code);
		if(LScript.onerror)
			LScript.onerror(err, this._last_executed_code, this);
		return false;
	}
	return true;
}

LScript.prototype.hasMethod = function(name)
{
	if(!this._context || !this._context[name] || typeof(this._context[name]) != "function") 
		return false;
	return true;
}


LScript.prototype.callMethod = function(name, argv)
{
	if(!this._context || !this._context[name]) 
		return;

	if(!this.catch_exceptions)
	{
		if(!argv || argv.constructor !== Array)
			return this._context[name].call(this._context, argv);
		return this._context[name].apply(this._context, argv);
	}

	try
	{
		if(!argv || argv.constructor !== Array)
			return this._context[name].call(this._context, argv);
		return this._context[name].apply(this._context, argv);
	}
	catch(err)
	{
		console.error("Error in function\n" + err);
		if(this.onerror)
			this.onerror(err);
	}
}

//from kybernetikos in stackoverflow
LScript.applyToConstructor = function(constructor, argArray) {
    var args = [null].concat(argArray);
    var factoryFunction = constructor.bind.apply(constructor, args);
    return new factoryFunction();
}

LScript.expandCode = function(code)
{

	//allow support to multiline strings
	if( code.indexOf("'''") != -1 )
	{
		var lines = code.split("'''");
		code = "";
		for(var i = 0; i < lines.length; i++)
		{
			if(i % 2 == 0)
			{
				code += lines[i];
				continue;
			}

			code += '"' + lines[i].split("\n").join("\\n\\\n") + '"';
		}
	}

	/* using regex, not working
	if( code.indexOf("'''") != -1 )
	{
		var exp = new RegExp("\'\'\'(.|\n)*\'\'\'", "mg");
		code = code.replace( exp, addSlashes );
	}

	function addSlashes(a){ 
		var str = a.split("\n").join("\\n\\\n");
		return '"' + str.substr(3, str.length - 6 ) + '"'; //remove '''
	}
	*/

	return code;
}
